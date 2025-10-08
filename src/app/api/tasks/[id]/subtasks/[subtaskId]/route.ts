import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { prisma } from "@/lib/db"

// PATCH update a subtask
export async function PATCH(request: NextRequest, { params }: { params: { id: string, subtaskId: string } }) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, completed } = body

    // Verify user has access to the task
    const subtask = await prisma.subTask.findFirst({
      where: {
        id: params.subtaskId,
        taskId: params.id,
        task: {
          project: {
            workspaceId: user.workspaceId
          }
        }
      }
    })

    if (!subtask) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 })
    }

    const updatedSubtask = await prisma.subTask.update({
      where: { id: params.subtaskId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() }),
        ...(completed !== undefined && { completed })
      }
    })

    return NextResponse.json(updatedSubtask)
  } catch (error) {
    console.error("Error updating subtask:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE a subtask
export async function DELETE(request: NextRequest, { params }: { params: { id: string, subtaskId: string } }) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user has access to the task
    const subtask = await prisma.subTask.findFirst({
      where: {
        id: params.subtaskId,
        taskId: params.id,
        task: {
          project: {
            workspaceId: user.workspaceId
          }
        }
      }
    })

    if (!subtask) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 })
    }

    await prisma.subTask.delete({
      where: { id: params.subtaskId }
    })

    return NextResponse.json({ message: "Subtask deleted successfully" })
  } catch (error) {
    console.error("Error deleting subtask:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
