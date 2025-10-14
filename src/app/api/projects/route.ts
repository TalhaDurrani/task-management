import { type NextRequest, NextResponse } from "next/server"
import { ProjectService } from "@/services/projectService"
import { AuthService } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get workspaceId from query params (optional)
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    // If workspaceId is provided, filter projects by that workspace
    // Otherwise, return projects from all workspaces user has access to
    let projects
    if (workspaceId) {
      projects = await ProjectService.getProjectsByWorkspace(user.id, workspaceId)
    } else {
      projects = await ProjectService.getProjects(user.id)
    }

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching projects:", error)
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
    const project = await ProjectService.createProject(body, user.id)

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error("Error creating project:", error)
    if (error instanceof Error && error.message.includes('User must be assigned to a workspace')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

