import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { joinCode } = await request.json()

    if (!joinCode) {
      return NextResponse.json({ error: "Workspace code is required" }, { status: 400 })
    }

    const workspace = await prisma.workspace.findUnique({
      where: { joinCode },
    })

    if (!workspace) {
      return NextResponse.json({ error: "Invalid workspace code" }, { status: 404 })
    }

    // Check if user is already a member
    const isOwner = await prisma.workspace.findFirst({
      where: { id: workspace.id, ownerId: user.id }
    })
    if (user.workspaceId === workspace.id || isOwner) {
      return NextResponse.json({ error: "You are already a member of this workspace" }, { status: 409 })
    }

    // Add user to workspace with MEMBER role
    // DON'T update user's workspaceId - that should remain their primary workspace
    await prisma.$transaction([
      // Create WorkspaceMember record with MEMBER role
      prisma.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: "MEMBER"
        }
      }),
      // Also connect user to workspace members relation for backward compatibility
      prisma.workspace.update({
        where: { id: workspace.id },
        data: {
          members: {
            connect: { id: user.id }
          }
        }
      })
    ])

    return NextResponse.json({
      success: true,
      message: "Successfully joined workspace",
      workspace: {
        id: workspace.id,
        name: workspace.name
      }
    })
  } catch (error) {
    console.error("Error joining workspace:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
