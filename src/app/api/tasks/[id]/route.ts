import { NextRequest, NextResponse } from 'next/server'
import { TaskService } from "@/services/taskService"
import { AuthService } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Use TaskService to get comprehensive task details including custom fields, subtasks, comments, etc.
    const task = await TaskService.getTask(params.id, user.id)

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Return task with all details
    return NextResponse.json(task)
  } catch (error) {
    console.error("Error fetching task:", error)
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
    
    // If status is provided, use specific status update method
    if (body.status !== undefined) {
      // Ensure customStatus is a string (Prisma expects String|null)
      let customStatusValue = body.customStatus
      if (customStatusValue !== undefined && customStatusValue !== null) {
        // Coerce numeric values to string to avoid Prisma type errors
        if (typeof customStatusValue === 'number') {
          customStatusValue = String(customStatusValue)
        }
      }

      // Allow passing customStatus from client to be stored with the task
      const updatedTask = await TaskService.updateTaskStatus(
        params.id,
        body.status,
        user.id,
        { customStatus: customStatusValue, force: true } // Allow all status transitions
      )
      return NextResponse.json(updatedTask)
    }

    // Fallback to general task update (for priority, title, etc.)
    const task = await TaskService.updateTask(params.id, body, user.id)
    return NextResponse.json(task)
  } catch (error) {
    console.error("Error updating task:", error)
    
    // Detailed error handling
    if (error instanceof Error) {
      switch (error.message) {
        case 'Task not found or access denied':
          return NextResponse.json({ error: "Task not found" }, { status: 404 })
        case 'User not assigned to workspace':
          return NextResponse.json({ error: "Unauthorized access" }, { status: 403 })
        default:
          return NextResponse.json({ error: error.message }, { status: 500 })
      }
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
