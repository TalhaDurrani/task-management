import { type NextRequest, NextResponse } from "next/server"
import { ProjectService } from "@/services/projectService"
import { AuthService } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const project = await ProjectService.getProject(params.id, user.id)
    return NextResponse.json(project)
  } catch (error) {
    console.error("Error fetching project:", error)
    if (error instanceof Error && error.message === 'Project not found') {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const project = await ProjectService.updateProject(params.id, body, user.id)
    return NextResponse.json(project)
  } catch (error) {
    console.error("Error updating project:", error)
    if (error instanceof Error && error.message === 'Project not found or access denied') {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await ProjectService.deleteProject(params.id, user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting project:", error)
    if (error instanceof Error && error.message === 'Project not found or access denied') {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
