import { type NextRequest, NextResponse } from "next/server"
import { TaskService } from "@/services/taskService"
import { AuthService } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const task = await TaskService.getTask(params.id, user.id)
    return NextResponse.json(task)
  } catch (error) {
    console.error("Error fetching task:", error)
    if (error instanceof Error && error.message === 'Task not found or access denied') {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
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
    const task = await TaskService.updateTask(params.id, body, user.id)
    return NextResponse.json(task)
  } catch (error) {
    console.error("Error updating task:", error)
    if (error instanceof Error && error.message === 'Task not found or access denied') {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
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

    await TaskService.deleteTask(params.id, user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting task:", error)
    if (error instanceof Error && error.message === 'Task not found or access denied') {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
