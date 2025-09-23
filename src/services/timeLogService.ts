import { prisma } from '@/lib/db'

export interface CreateTimeLogData {
  taskId: string
  hoursSpent: number
  description?: string
  logDate?: Date
}

export interface UpdateTimeLogData {
  hoursSpent?: number
  description?: string
  logDate?: Date
}

export class TimeLogService {
  static async getTimeLogs(taskId: string, userId: string) {
    try {
      // Check if user has access to the task
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          project: {
            OR: [
              { userId: userId },
              { createdBy: userId }
            ]
          }
        }
      })

      if (!task) {
        throw new Error('Task not found or access denied')
      }

      const timeLogs = await prisma.timeLog.findMany({
        where: {
          taskId: taskId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          logDate: 'desc'
        }
      })

      return timeLogs.map(timeLog => ({
        id: timeLog.id,
        taskId: timeLog.taskId,
        userId: timeLog.userId,
        hoursSpent: timeLog.hoursSpent,
        description: timeLog.description,
        logDate: timeLog.logDate,
        createdAt: timeLog.createdAt,
        user: timeLog.user
      }))
    } catch (error) {
      console.error('Error fetching time logs:', error)
      throw new Error('Failed to fetch time logs')
    }
  }

  static async getTimeLog(id: string, userId: string) {
    try {
      const timeLog = await prisma.timeLog.findFirst({
        where: {
          id: id,
          task: {
            project: {
              OR: [
                { userId: userId },
                { createdBy: userId }
              ]
            }
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          task: {
            select: {
              id: true,
              label: true,
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

      if (!timeLog) {
        throw new Error('Time log not found or access denied')
      }

      return {
        id: timeLog.id,
        taskId: timeLog.taskId,
        userId: timeLog.userId,
        hoursSpent: timeLog.hoursSpent,
        description: timeLog.description,
        logDate: timeLog.logDate,
        createdAt: timeLog.createdAt,
        user: timeLog.user,
        task: timeLog.task
      }
    } catch (error) {
      console.error('Error fetching time log:', error)
      throw new Error('Failed to fetch time log')
    }
  }

  static async createTimeLog(data: CreateTimeLogData, userId: string) {
    try {
      // Check if user has access to the task
      const task = await prisma.task.findFirst({
        where: {
          id: data.taskId,
          project: {
            OR: [
              { userId: userId },
              { createdBy: userId }
            ]
          }
        },
        include: {
          project: true
        }
      })

      if (!task) {
        throw new Error('Task not found or access denied')
      }

      const timeLog = await prisma.timeLog.create({
        data: {
          taskId: data.taskId,
          userId: userId,
          hoursSpent: data.hoursSpent,
          description: data.description,
          logDate: data.logDate || new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      })

      // Create activity log
      await prisma.activity.create({
        data: {
          userId: userId,
          type: 'time_logged',
          title: 'Time Logged',
          message: `${data.hoursSpent} hours logged for task "${task.label || 'Untitled'}"`,
          taskId: task.id,
          projectId: task.projectId
        }
      })

      return {
        id: timeLog.id,
        taskId: timeLog.taskId,
        userId: timeLog.userId,
        hoursSpent: timeLog.hoursSpent,
        description: timeLog.description,
        logDate: timeLog.logDate,
        createdAt: timeLog.createdAt,
        user: timeLog.user
      }
    } catch (error) {
      console.error('Error creating time log:', error)
      throw new Error('Failed to create time log')
    }
  }

  static async updateTimeLog(id: string, data: UpdateTimeLogData, userId: string) {
    try {
      // Check if user has access to the time log and is the author
      const existingTimeLog = await prisma.timeLog.findFirst({
        where: {
          id: id,
          userId: userId,
          task: {
            project: {
              OR: [
                { userId: userId },
                { createdBy: userId }
              ]
            }
          }
        },
        include: {
          task: {
            include: {
              project: true
            }
          }
        }
      })

      if (!existingTimeLog) {
        throw new Error('Time log not found or access denied')
      }

      const timeLog = await prisma.timeLog.update({
        where: { id: id },
        data: {
          hoursSpent: data.hoursSpent,
          description: data.description,
          logDate: data.logDate
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      })

      // Create activity log
      await prisma.activity.create({
        data: {
          userId: userId,
          type: 'time_log_updated',
          title: 'Time Log Updated',
          message: `Time log updated for task "${existingTimeLog.task.label || 'Untitled'}"`,
          taskId: existingTimeLog.task.id,
          projectId: existingTimeLog.task.projectId
        }
      })

      return {
        id: timeLog.id,
        taskId: timeLog.taskId,
        userId: timeLog.userId,
        hoursSpent: timeLog.hoursSpent,
        description: timeLog.description,
        logDate: timeLog.logDate,
        createdAt: timeLog.createdAt,
        user: timeLog.user
      }
    } catch (error) {
      console.error('Error updating time log:', error)
      throw new Error('Failed to update time log')
    }
  }

  static async deleteTimeLog(id: string, userId: string) {
    try {
      // Check if user has access to the time log and is the author
      const existingTimeLog = await prisma.timeLog.findFirst({
        where: {
          id: id,
          userId: userId,
          task: {
            project: {
              OR: [
                { userId: userId },
                { createdBy: userId }
              ]
            }
          }
        },
        include: {
          task: {
            include: {
              project: true
            }
          }
        }
      })

      if (!existingTimeLog) {
        throw new Error('Time log not found or access denied')
      }

      await prisma.timeLog.delete({
        where: { id: id }
      })

      // Create activity log
      await prisma.activity.create({
        data: {
          userId: userId,
          type: 'time_log_deleted',
          title: 'Time Log Deleted',
          message: `Time log deleted from task "${existingTimeLog.task.label || 'Untitled'}"`,
          taskId: existingTimeLog.task.id,
          projectId: existingTimeLog.task.projectId
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error deleting time log:', error)
      throw new Error('Failed to delete time log')
    }
  }

  static async getTimeLogsByProject(projectId: string, userId: string) {
    try {
      // Check if user has access to the project
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { userId: userId },
            { createdBy: userId }
          ]
        }
      })

      if (!project) {
        throw new Error('Project not found or access denied')
      }

      const timeLogs = await prisma.timeLog.findMany({
        where: {
          task: {
            projectId: projectId
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          task: {
            select: {
              id: true,
              label: true,
              project: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        },
        orderBy: {
          logDate: 'desc'
        }
      })

      return timeLogs.map(timeLog => ({
        id: timeLog.id,
        taskId: timeLog.taskId,
        userId: timeLog.userId,
        hoursSpent: timeLog.hoursSpent,
        description: timeLog.description,
        logDate: timeLog.logDate,
        createdAt: timeLog.createdAt,
        user: timeLog.user,
        task: timeLog.task
      }))
    } catch (error) {
      console.error('Error fetching project time logs:', error)
      throw new Error('Failed to fetch project time logs')
    }
  }

  static async getTimeLogsByUser(userId: string, startDate?: Date, endDate?: Date) {
    try {
      const whereClause: any = {
        userId: userId
      }

      if (startDate || endDate) {
        whereClause.logDate = {}
        if (startDate) whereClause.logDate.gte = startDate
        if (endDate) whereClause.logDate.lte = endDate
      }

      const timeLogs = await prisma.timeLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          task: {
            select: {
              id: true,
              label: true,
              project: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        },
        orderBy: {
          logDate: 'desc'
        }
      })

      return timeLogs.map(timeLog => ({
        id: timeLog.id,
        taskId: timeLog.taskId,
        userId: timeLog.userId,
        hoursSpent: timeLog.hoursSpent,
        description: timeLog.description,
        logDate: timeLog.logDate,
        createdAt: timeLog.createdAt,
        user: timeLog.user,
        task: timeLog.task
      }))
    } catch (error) {
      console.error('Error fetching user time logs:', error)
      throw new Error('Failed to fetch user time logs')
    }
  }
}
