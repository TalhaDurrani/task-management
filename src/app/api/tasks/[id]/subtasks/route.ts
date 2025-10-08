import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { prisma } from "@/lib/db"

// GET all subtasks for a task
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user has access to the task
    const task = await prisma.task.findFirst({
      where: {
        id: params.id,
        project: {
          workspaceId: user.workspaceId
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const subtasks = await prisma.subTask.findMany({
      where: { taskId: params.id },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(subtasks)
  } catch (error) {
    console.error("Error fetching subtasks:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST create a new subtask
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description } = body

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Subtask title is required" }, { status: 400 })
    }

    // Verify user has access to the task
    const task = await prisma.task.findFirst({
      where: {
        id: params.id,
        project: {
          workspaceId: user.workspaceId
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const subtask = await prisma.subTask.create({
      data: {
        taskId: params.id,
        title: title.trim(),
        description: description?.trim(),
        completed: false
      }
    })

    return NextResponse.json(subtask, { status: 201 })
  } catch (error) {
    console.error("Error creating subtask:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
