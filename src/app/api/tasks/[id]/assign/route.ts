import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { prisma } from "@/lib/db"

// POST - Assign a user to a task
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    // Check if task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        project: true,
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Check if user is already assigned
    const isAlreadyAssigned = task.assignees.some(
      (assignee) => assignee.userId === userId
    )

    if (isAlreadyAssigned) {
      return NextResponse.json(
        { error: "User is already assigned to this task" },
        { status: 400 }
      )
    }

    // Create task assignee
    await prisma.taskAssignee.create({
      data: {
        taskId: params.id,
        userId: userId,
      }
    })

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: 'task_assigned',
        title: 'User Assigned',
        message: `User was assigned to task "${task.title}"`,
        taskId: task.id,
        projectId: task.projectId,
      }
    })

    // Fetch updated task with assignees
    const updatedTask = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      }
    })

    // Format assignees for response
    const formattedTask = {
      ...updatedTask,
      assignees: updatedTask?.assignees.map((a) => a.user) || []
    }

    return NextResponse.json(formattedTask)
  } catch (error) {
    console.error("Error assigning user to task:", error)
    return NextResponse.json(
      { error: "Failed to assign user to task" },
      { status: 500 }
    )
  }
}
