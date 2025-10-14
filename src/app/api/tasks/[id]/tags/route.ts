import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { prisma } from "@/lib/db"

// POST - Add a tag to a task
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tagId } = await request.json()

    if (!tagId) {
      return NextResponse.json(
        { error: "Tag ID is required" },
        { status: 400 }
      )
    }

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        project: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Check if tag is already added
    const isAlreadyAdded = task.tags.some((t) => t.tagId === tagId)

    if (isAlreadyAdded) {
      return NextResponse.json(
        { error: "Tag is already added to this task" },
        { status: 400 }
      )
    }

    // Create task tag
    await prisma.taskTag.create({
      data: {
        taskId: params.id,
        tagId: tagId,
      }
    })

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: 'task_tagged',
        title: 'Tag Added',
        message: `Tag was added to task "${task.title}"`,
        taskId: task.id,
        projectId: task.projectId,
      }
    })

    // Fetch updated task with tags
    const updatedTask = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              }
            }
          }
        }
      }
    })

    // Format tags for response
    const formattedTask = {
      ...updatedTask,
      tags: updatedTask?.tags.map((t) => t.tag) || []
    }

    return NextResponse.json(formattedTask)
  } catch (error) {
    console.error("Error adding tag to task:", error)
    return NextResponse.json(
      { error: "Failed to add tag to task" },
      { status: 500 }
    )
  }
}
