import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { WorkspaceService } from "@/services/workspaceService"

// GET /api/workspaces/[id]/users - Get all users in a workspace
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const users = await WorkspaceService.getWorkspaceUsers(params.id, user.id)
    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching workspace users:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/workspaces/[id]/users - Add user to workspace
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    await WorkspaceService.addUserToWorkspace(params.id, userId, user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error adding user to workspace:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/workspaces/[id]/users/[userId] - Remove user from workspace
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    await WorkspaceService.removeUserFromWorkspace(params.id, userId, user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing user from workspace:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
