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

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    const tasks = await TaskService.getTasks(projectId, user.id)
    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Error fetching tasks:", error)
    if (error instanceof Error && error.message === 'Project not found or access denied') {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
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
