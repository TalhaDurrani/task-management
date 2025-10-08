import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can assign users to workspaces
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const body = await request.json()
    const { workspaceId, role } = body

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 })
    }

    // Validate role
    const memberRole = role && ['ADMIN', 'MEMBER'].includes(role) ? role : 'MEMBER'

    // Get the workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    })

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    // Check if user is already a member
    const existingMembership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: params.id,
          workspaceId: workspaceId
        }
      }
    })

    if (existingMembership) {
      return NextResponse.json({ error: "User is already a member of this workspace" }, { status: 409 })
    }

    // Update user and create workspace membership in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the user's workspaceId
      const updatedUser = await tx.user.update({
        where: { id: params.id },
        data: {
          workspaceId: workspaceId
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          workspaceId: true,
          workspace: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      // Create WorkspaceMember record
      await tx.workspaceMember.create({
        data: {
          userId: params.id,
          workspaceId: workspaceId,
          role: memberRole
        }
      })

      return updatedUser
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error assigning user to workspace:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
