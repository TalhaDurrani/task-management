import { type NextRequest, NextResponse } from "next/server"
import { TaskService } from "@/services/taskService"
import { AuthService } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const workspaceId = searchParams.get("workspaceId")

    // If workspaceId is provided, get tasks from all projects in that workspace
    if (workspaceId && !projectId) {
      const tasks = await TaskService.getTasksByWorkspace(user.id, workspaceId)
      return NextResponse.json(tasks)
    }

    // If projectId is provided, get tasks from that specific project
    if (projectId) {
      const tasks = await TaskService.getTasks(projectId, user.id)
      return NextResponse.json(tasks)
    }

    // If neither workspaceId nor projectId is provided, return all tasks from user's workspaces
    const tasks = await TaskService.getAllUserTasks(user.id)
    return NextResponse.json(tasks)

  } catch (error) {
    console.error("Error fetching tasks:", error)
    if (error instanceof Error && error.message === 'Project not found or access denied') {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    if (error instanceof Error && error.message === 'Access denied to this workspace') {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
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
    const task = await TaskService.createTask(body, user.id)

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error("Error creating task:", error)
    if (error instanceof Error && error.message === 'Project not found or access denied') {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
