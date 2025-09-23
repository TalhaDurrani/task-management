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

    // Only admins and super admins can assign users to workspaces
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const body = await request.json()
    const { workspaceId } = body

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 })
    }

    // Get the workspace to find its organization
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    // Check if admin has access to this workspace's organization
    if (user.role === 'ADMIN' && user.organizationId !== workspace.organizationId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        organizationId: workspace.organizationId,
        workspaceId: workspaceId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organizationId: true,
        workspaceId: true,
        organization: {
          select: {
            id: true,
            name: true
          }
        },
        workspace: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error assigning user to workspace:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
