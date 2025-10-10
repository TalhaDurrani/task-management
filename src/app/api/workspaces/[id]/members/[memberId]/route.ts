import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { prisma } from "@/lib/db"

// PATCH /api/workspaces/[id]/members/[memberId] - Update workspace member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: workspaceId, memberId } = params
    const { role } = await request.json()

    if (!role || !['ADMIN', 'MEMBER'].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Get workspace to check ownership
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    })

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    // ✅ PROTECTION: Prevent changing the workspace owner's role
    if (memberId === workspace.ownerId) {
      return NextResponse.json({ error: "Cannot change workspace owner's role" }, { status: 403 })
    }

    // ✅ PROTECTION: Prevent self-demotion
    if (memberId === user.id) {
      return NextResponse.json({ error: "Cannot change your own role" }, { status: 403 })
    }

    // Check if the current user is an admin of this workspace
    const currentUserMembership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: workspaceId
        }
      }
    })

    const isWorkspaceOwner = workspace.ownerId === user.id
    const isWorkspaceAdmin = currentUserMembership?.role === 'ADMIN'

    if (!isWorkspaceOwner && !isWorkspaceAdmin) {
      return NextResponse.json({ error: "Only workspace admins or owners can change member roles" }, { status: 403 })
    }

    // Update the workspace member role
    const updatedMember = await prisma.workspaceMember.update({
      where: {
        userId_workspaceId: {
          userId: memberId,
          workspaceId: workspaceId
        }
      },
      data: {
        role: role
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      member: {
        id: updatedMember.user.id,
        name: updatedMember.user.name,
        email: updatedMember.user.email,
        role: updatedMember.role,
        joinedAt: updatedMember.joinedAt
      }
    })
  } catch (error) {
    console.error("Error updating workspace member role:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/workspaces/[id]/members/[memberId] - Remove workspace member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: workspaceId, memberId } = params

    // Get workspace to check ownership
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    })

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    // ✅ PROTECTION: Prevent removing the workspace owner
    if (memberId === workspace.ownerId) {
      return NextResponse.json({ error: "Cannot remove workspace owner" }, { status: 403 })
    }

    // Check if the current user is an admin of this workspace
    const currentUserMembership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: workspaceId
        }
      }
    })

    const isWorkspaceOwner = workspace.ownerId === user.id
    const isWorkspaceAdmin = currentUserMembership?.role === 'ADMIN'

    if (!isWorkspaceOwner && !isWorkspaceAdmin) {
      return NextResponse.json({ error: "Only workspace admins or owners can remove members" }, { status: 403 })
    }

    // Check if user is being removed from their primary workspace
    const userToRemove = await prisma.user.findUnique({
      where: { id: memberId },
      select: { 
        workspaceId: true,
        workspaceMemberships: {
          where: {
            workspaceId: {
              not: workspaceId  // Get OTHER workspace memberships
            }
          },
          select: {
            workspaceId: true
          }
        }
      }
    })

    // Remove the workspace member
    await prisma.$transaction([
      // Delete WorkspaceMember record for THIS workspace only
      prisma.workspaceMember.delete({
        where: {
          userId_workspaceId: {
            userId: memberId,
            workspaceId: workspaceId
          }
        }
      }),
      // Disconnect from workspace members relation
      prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          members: {
            disconnect: { id: memberId }
          }
        }
      }),
      // Update user's primary workspaceId only if this was their primary workspace
      ...(userToRemove?.workspaceId === workspaceId ? [
        prisma.user.update({
          where: { id: memberId },
          data: {
            // If they have other workspace memberships, set to the first one
            // Otherwise set to null
            workspaceId: userToRemove.workspaceMemberships.length > 0 
              ? userToRemove.workspaceMemberships[0].workspaceId 
              : null
          }
        })
      ] : [])
    ])

    return NextResponse.json({
      success: true,
      message: "Member removed successfully"
    })
  } catch (error) {
    console.error("Error removing workspace member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
