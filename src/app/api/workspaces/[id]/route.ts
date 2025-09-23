import { type NextRequest, NextResponse } from "next/server"
import { WorkspaceService } from "@/services/workspaceService"
import { AuthService } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const workspace = await WorkspaceService.getWorkspace(params.id, user.id)
    return NextResponse.json(workspace)
  } catch (error) {
    console.error("Error fetching workspace:", error)
    if (error instanceof Error && error.message === 'User not assigned to any organization') {
      return NextResponse.json({ error: "User not assigned to any organization" }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'Workspace not found or access denied') {
      return NextResponse.json({ error: "Workspace not found or access denied" }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const workspace = await WorkspaceService.updateWorkspace(params.id, body, user.id)
    
    return NextResponse.json(workspace)
  } catch (error) {
    console.error("Error updating workspace:", error)
    if (error instanceof Error && error.message === 'Access denied') {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Workspace not found or access denied') {
      return NextResponse.json({ error: "Workspace not found or access denied" }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await WorkspaceService.deleteWorkspace(params.id, user.id)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error deleting workspace:", error)
    if (error instanceof Error && error.message === 'Access denied') {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Workspace not found or access denied') {
      return NextResponse.json({ error: "Workspace not found or access denied" }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
