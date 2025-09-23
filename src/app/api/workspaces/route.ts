import { type NextRequest, NextResponse } from "next/server"
import { WorkspaceService } from "@/services/workspaceService"
import { AuthService } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const workspaces = await WorkspaceService.getWorkspaces(user.id)
    return NextResponse.json(workspaces)
  } catch (error) {
    console.error("Error fetching workspaces:", error)
    if (error instanceof Error && error.message === 'User not assigned to any organization') {
      return NextResponse.json({ error: "User not assigned to any organization" }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const workspace = await WorkspaceService.createWorkspace(body, user.id)
    
    return NextResponse.json(workspace, { status: 201 })
  } catch (error) {
    console.error("Error creating workspace:", error)
    if (error instanceof Error && error.message === 'Only admins can create workspaces') {
      return NextResponse.json({ error: "Only admins can create workspaces" }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Access denied') {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
