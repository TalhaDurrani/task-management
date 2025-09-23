import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get("taskId")
    const userId = searchParams.get("userId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Build where clause
    const where: any = {}
    
    if (taskId) {
      where.taskId = taskId
    }
    
    if (userId) {
      where.userId = userId
    } else {
      // If no specific user, only show current user's logs
      where.userId = user.id
    }
    
    if (startDate && endDate) {
      where.logDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const timeLogs = await prisma.timeLog.findMany({
      where,
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
      },
      orderBy: {
        logDate: 'desc'
      }
    })

    return NextResponse.json(timeLogs)
  } catch (error) {
    console.error("Error fetching time logs:", error)
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
    const { taskId, hoursSpent, description, logDate } = body

    // Validate required fields
    if (!taskId || !hoursSpent) {
      return NextResponse.json({ error: "Task ID and hours spent are required" }, { status: 400 })
    }

    // Check if user has access to the task
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { userId: user.id },
          { assignedTo: user.id },
          { createdBy: user.id },
          {
            project: {
              OR: [
                { userId: user.id },
                { createdBy: user.id },
                {
                  workspace: {
                    users: {
                      some: { id: user.id }
                    }
                  }
                }
              ]
            }
          }
        ]
      }
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found or access denied" }, { status: 404 })
    }

    // Create time log
    const timeLog = await prisma.timeLog.create({
      data: {
        taskId,
        userId: user.id,
        hoursSpent: parseFloat(hoursSpent),
        description: description || null,
        logDate: logDate ? new Date(logDate) : new Date()
      },
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
        type: 'time_logged',
        title: 'Time Logged',
        message: `Logged ${hoursSpent} hours on task "${task.title}"`,
        taskId: task.id,
        projectId: task.projectId
      }
    })

    return NextResponse.json(timeLog, { status: 201 })
  } catch (error) {
    console.error("Error creating time log:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}