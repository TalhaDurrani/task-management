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

    console.log(`🔍 Fetching tasks for project: ${projectId}, user: ${user.id}`)
    const tasks = await TaskService.getTasks(projectId, user.id)
    console.log(`📊 Fetched ${tasks.length} tasks`)
       console.log(`📊\n\n\n\n\n\n\n\nn\\n\n Fetched  tasks`,tasks,"\n\n\n\n\n")
    
    // Log first task status for debugging
    if (tasks.length > 0) {
      console.log(`📋 Sample task status: ${tasks[0].id} = ${tasks[0].status}`)
    }
    
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
