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

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
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

    // Get active timer for this task and user
    const activeTimer = await prisma.timer.findFirst({
      where: {
        taskId,
        userId: user.id,
        isActive: true
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
        }
      }
    })

    return NextResponse.json(activeTimer)
  } catch (error) {
    console.error("Error fetching timer:", error)
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
    const { taskId, action, description } = body

    if (!taskId || !action) {
      return NextResponse.json({ error: "Task ID and action are required" }, { status: 400 })
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

    let result

    switch (action) {
      case 'start':
        // Stop any other active timers for this user
        await prisma.timer.updateMany({
          where: {
            userId: user.id,
            isActive: true
          },
          data: {
            isActive: false,
            endedAt: new Date()
          }
        })

        // Create new timer
        result = await prisma.timer.create({
          data: {
            taskId,
            userId: user.id,
            description: description || null,
            startedAt: new Date(),
            isActive: true
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
            }
          }
        })

        // Create activity log
        await prisma.activity.create({
          data: {
            userId: user.id,
            type: 'timer_started',
            title: 'Timer Started',
            message: `Started timer for task "${task.title}"`,
            taskId: task.id,
            projectId: task.projectId
          }
        })
        break

      case 'stop':
        // Find active timer
        const activeTimer = await prisma.timer.findFirst({
          where: {
            taskId,
            userId: user.id,
            isActive: true
          }
        })

        if (!activeTimer) {
          return NextResponse.json({ error: "No active timer found" }, { status: 404 })
        }

        // Calculate elapsed time
        const now = new Date()
        const elapsedMs = now.getTime() - activeTimer.startedAt.getTime()
        const elapsedHours = elapsedMs / (1000 * 60 * 60)

        // Stop timer
        result = await prisma.timer.update({
          where: { id: activeTimer.id },
          data: {
            isActive: false,
            endedAt: now,
            elapsedTime: elapsedHours
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
            }
          }
        })

        // Create time log entry
        await prisma.timeLog.create({
          data: {
            taskId,
            userId: user.id,
            hoursSpent: elapsedHours,
            description: activeTimer.description || `Timer session (${Math.round(elapsedHours * 100) / 100} hours)`,
            logDate: now
          }
        })

        // Create activity log
        await prisma.activity.create({
          data: {
            userId: user.id,
            type: 'timer_stopped',
            title: 'Timer Stopped',
            message: `Stopped timer for task "${task.title}" (${Math.round(elapsedHours * 100) / 100} hours)`,
            taskId: task.id,
            projectId: task.projectId
          }
        })
        break

      case 'pause':
        // Find active timer
        const timerToPause = await prisma.timer.findFirst({
          where: {
            taskId,
            userId: user.id,
            isActive: true
          }
        })

        if (!timerToPause) {
          return NextResponse.json({ error: "No active timer found" }, { status: 404 })
        }

        // Pause timer
        result = await prisma.timer.update({
          where: { id: timerToPause.id },
          data: {
            isActive: false,
            pausedAt: new Date()
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
            }
          }
        })

        // Create activity log
        await prisma.activity.create({
          data: {
            userId: user.id,
            type: 'timer_paused',
            title: 'Timer Paused',
            message: `Paused timer for task "${task.title}"`,
            taskId: task.id,
            projectId: task.projectId
          }
        })
        break

      case 'resume':
        // Find paused timer
        const timerToResume = await prisma.timer.findFirst({
          where: {
            taskId,
            userId: user.id,
            isActive: false,
            pausedAt: { not: null },
            endedAt: null
          }
        })

        if (!timerToResume) {
          return NextResponse.json({ error: "No paused timer found" }, { status: 404 })
        }

        // Resume timer
        result = await prisma.timer.update({
          where: { id: timerToResume.id },
          data: {
            isActive: true,
            pausedAt: null,
            startedAt: new Date() // Reset start time for simplicity
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
            }
          }
        })

        // Create activity log
        await prisma.activity.create({
          data: {
            userId: user.id,
            type: 'timer_resumed',
            title: 'Timer Resumed',
            message: `Resumed timer for task "${task.title}"`,
            taskId: task.id,
            projectId: task.projectId
          }
        })
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error managing timer:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
