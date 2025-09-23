import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { hoursSpent, description, logDate } = body

    // Check if time log exists and user has access
    const existingTimeLog = await prisma.timeLog.findFirst({
      where: {
        id: params.id,
        userId: user.id
      },
      include: {
        task: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    if (!existingTimeLog) {
      return NextResponse.json({ error: "Time log not found or access denied" }, { status: 404 })
    }

    // Update time log
    const updateData: any = {}
    if (hoursSpent !== undefined) updateData.hoursSpent = parseFloat(hoursSpent)
    if (description !== undefined) updateData.description = description
    if (logDate !== undefined) updateData.logDate = new Date(logDate)

    const updatedTimeLog = await prisma.timeLog.update({
      where: { id: params.id },
      data: updateData,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            project: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: 'time_log_updated',
        title: 'Time Log Updated',
        message: `Updated time log for task "${existingTimeLog.task.title}"`,
        taskId: existingTimeLog.taskId
      }
    })

    return NextResponse.json(updatedTimeLog)
  } catch (error) {
    console.error("Error updating time log:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if time log exists and user has access
    const existingTimeLog = await prisma.timeLog.findFirst({
      where: {
        id: params.id,
        userId: user.id
      },
      include: {
        task: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    if (!existingTimeLog) {
      return NextResponse.json({ error: "Time log not found or access denied" }, { status: 404 })
    }

    // Delete time log
    await prisma.timeLog.delete({
      where: { id: params.id }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: 'time_log_deleted',
        title: 'Time Log Deleted',
        message: `Deleted time log for task "${existingTimeLog.task.title}"`,
        taskId: existingTimeLog.taskId
      }
    })

    return NextResponse.json({ message: "Time log deleted successfully" })
  } catch (error) {
    console.error("Error deleting time log:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
