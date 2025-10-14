import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { prisma } from "@/lib/db"

// DELETE - Remove a tag from a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; tagId: string } }
) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        project: true
      }
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Delete task tag
    await prisma.taskTag.deleteMany({
      where: {
        taskId: params.id,
        tagId: params.tagId,
      }
    })

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: 'task_tag_removed',
        title: 'Tag Removed',
        message: `Tag was removed from task "${task.title}"`,
        taskId: task.id,
        projectId: task.projectId,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing tag from task:", error)
    return NextResponse.json(
      { error: "Failed to remove tag from task" },
      { status: 500 }
    )
  }
}
