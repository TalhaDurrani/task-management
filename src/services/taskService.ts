import { prisma } from '@/lib/db'
import type { CreateTaskData, UpdateTaskData, TaskStatus } from "@/types"

export class TaskService {
  static async getTasks(projectId: string, userId: string) {
    try {
      // First check if user has access to the project
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

      const tasks = await prisma.task.findMany({
        where: {
          projectId: projectId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          project: {
            select: {
              id: true,
              title: true,
              description: true
            }
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          },
          timeLogs: {
            include: {
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
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        projectId: task.projectId,
        userId: task.userId,
        createdBy: task.createdBy,
        completedAt: task.completedAt,
        assignedTo: task.assignedTo,
        status: task.status,
        label: task.label,
        dueDate: task.dueDate,
        endDate: task.endDate,
        attachments: task.attachments,
        createdAt: task.createdAt,
        assignee: task.user,
        project: task.project,
        comments: task.comments.map(comment => ({
          id: comment.id,
          taskId: comment.taskId,
          userId: comment.userId,
          content: comment.content,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          user: comment.user
        })),
        timeLogs: task.timeLogs.map(timeLog => ({
          id: timeLog.id,
          taskId: timeLog.taskId,
          userId: timeLog.userId,
          hoursSpent: timeLog.hoursSpent,
          description: timeLog.description,
          logDate: timeLog.logDate,
          createdAt: timeLog.createdAt,
          user: timeLog.user
        }))
      }))
    } catch (error) {
      console.error('Error fetching tasks:', error)
      throw new Error('Failed to fetch tasks')
    }
  }

  static async getTask(id: string, userId: string) {
    try {
      const task = await prisma.task.findFirst({
        where: {
          id: id,
          project: {
            OR: [
              { userId: userId },
              { createdBy: userId }
            ]
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          project: {
            select: {
              id: true,
              title: true,
              description: true
            }
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          },
          timeLogs: {
            include: {
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
          },
          subTasks: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      })

      if (!task) {
        throw new Error('Task not found or access denied')
      }

      return {
        id: task.id,
        projectId: task.projectId,
        userId: task.userId,
        createdBy: task.createdBy,
        completedAt: task.completedAt,
        assignedTo: task.assignedTo,
        status: task.status,
        label: task.label,
        dueDate: task.dueDate,
        endDate: task.endDate,
        attachments: task.attachments,
        createdAt: task.createdAt,
        assignee: task.user,
        project: task.project,
        comments: task.comments.map(comment => ({
          id: comment.id,
          taskId: comment.taskId,
          userId: comment.userId,
          content: comment.content,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          user: comment.user
        })),
        timeLogs: task.timeLogs.map(timeLog => ({
          id: timeLog.id,
          taskId: timeLog.taskId,
          userId: timeLog.userId,
          hoursSpent: timeLog.hoursSpent,
          description: timeLog.description,
          logDate: timeLog.logDate,
          createdAt: timeLog.createdAt,
          user: timeLog.user
        })),
        subTasks: task.subTasks.map(subTask => ({
          id: subTask.id,
          taskId: subTask.taskId,
          userId: subTask.userId,
          title: subTask.title,
          description: subTask.description,
          attachments: subTask.attachments,
          user: subTask.user
        }))
      }
    } catch (error) {
      console.error('Error fetching task:', error)
      throw new Error('Failed to fetch task')
    }
  }

  static async createTask(data: CreateTaskData, userId: string) {
    try {
      // Check if user has access to the project
      const project = await prisma.project.findFirst({
        where: {
          id: data.projectId,
          OR: [
            { userId: userId },
            { createdBy: userId }
          ]
        }
      })

      if (!project) {
        throw new Error('Project not found or access denied')
      }

      const task = await prisma.task.create({
        data: {
          projectId: data.projectId,
          title: data.title,
          description: data.description,
          userId: data.assignedTo || userId,
          createdBy: userId,
          assignedTo: data.assignedTo,
          status: data.status || 'PENDING',
          label: data.label,
          dueDate: data.dueDate,
          endDate: data.endDate,
          attachments: data.attachments
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          project: {
            select: {
              id: true,
              title: true,
              description: true
            }
          }
        }
      })

      // Create activity log
      await prisma.activity.create({
        data: {
          userId: userId,
          type: 'task_created',
          title: 'Task Created',
          message: `Task "${task.title}" was created in project "${project.title}"`,
          taskId: task.id,
          projectId: project.id
        }
      })

      return {
        id: task.id,
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        userId: task.userId,
        createdBy: task.createdBy,
        completedAt: task.completedAt,
        assignedTo: task.assignedTo,
        status: task.status,
        label: task.label,
        dueDate: task.dueDate,
        endDate: task.endDate,
        attachments: task.attachments,
        createdAt: task.createdAt,
        assignee: task.user,
        project: task.project,
        comments: [],
        timeLogs: [],
        subTasks: []
      }
    } catch (error) {
      console.error('Error creating task:', error)
      throw new Error('Failed to create task')
    }
  }

  static async updateTask(id: string, data: UpdateTaskData, userId: string) {
    try {
      // Check if user has access to the task
      const existingTask = await prisma.task.findFirst({
        where: {
          id: id,
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

      if (!existingTask) {
        throw new Error('Task not found or access denied')
      }

      const task = await prisma.task.update({
        where: { id: id },
        data: {
          assignedTo: data.assignedTo,
          status: data.status,
          label: data.label,
          dueDate: data.dueDate,
          endDate: data.endDate,
          attachments: data.attachments,
          completedAt: data.status === 'DONE' ? new Date() : null
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          project: {
            select: {
              id: true,
              title: true,
              description: true
            }
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          },
          timeLogs: {
            include: {
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
          }
        }
      })

      // Create activity log
      await prisma.activity.create({
        data: {
          userId: userId,
          type: 'task_updated',
          title: 'Task Updated',
          message: `Task "${task.label || 'Untitled'}" was updated`,
          taskId: task.id,
          projectId: task.projectId
        }
      })

      return {
        id: task.id,
        projectId: task.projectId,
        userId: task.userId,
        createdBy: task.createdBy,
        completedAt: task.completedAt,
        assignedTo: task.assignedTo,
        status: task.status,
        label: task.label,
        dueDate: task.dueDate,
        endDate: task.endDate,
        attachments: task.attachments,
        createdAt: task.createdAt,
        assignee: task.user,
        project: task.project,
        comments: task.comments.map(comment => ({
          id: comment.id,
          taskId: comment.taskId,
          userId: comment.userId,
          content: comment.content,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          user: comment.user
        })),
        timeLogs: task.timeLogs.map(timeLog => ({
          id: timeLog.id,
          taskId: timeLog.taskId,
          userId: timeLog.userId,
          hoursSpent: timeLog.hoursSpent,
          description: timeLog.description,
          logDate: timeLog.logDate,
          createdAt: timeLog.createdAt,
          user: timeLog.user
        }))
      }
    } catch (error) {
      console.error('Error updating task:', error)
      throw new Error('Failed to update task')
    }
  }

  static async deleteTask(id: string, userId: string) {
    try {
      // Check if user has access to the task
      const existingTask = await prisma.task.findFirst({
        where: {
          id: id,
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

      if (!existingTask) {
        throw new Error('Task not found or access denied')
      }

      // Delete related data first
      await prisma.comment.deleteMany({
        where: {
          taskId: id
        }
      })

      await prisma.timeLog.deleteMany({
        where: {
          taskId: id
        }
      })

      await prisma.subTask.deleteMany({
        where: {
          taskId: id
        }
      })

      await prisma.task.delete({
        where: { id: id }
      })

      // Create activity log
      await prisma.activity.create({
        data: {
          userId: userId,
          type: 'task_deleted',
          title: 'Task Deleted',
          message: `Task "${existingTask.label || 'Untitled'}" was deleted`,
          projectId: existingTask.projectId
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error deleting task:', error)
      throw new Error('Failed to delete task')
    }
  }

  static async updateTaskStatus(id: string, status: TaskStatus, userId: string) {
    try {
      // Check if user has access to the task
      const existingTask = await prisma.task.findFirst({
        where: {
          id: id,
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

      if (!existingTask) {
        throw new Error('Task not found or access denied')
      }

      const task = await prisma.task.update({
        where: { id: id },
        data: {
          status: status,
          completedAt: status === 'DONE' ? new Date() : null
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          project: {
            select: {
              id: true,
              title: true,
              description: true
            }
          }
        }
      })

      // Create activity log
      await prisma.activity.create({
        data: {
          userId: userId,
          type: 'task_status_updated',
          title: 'Task Status Updated',
          message: `Task "${task.label || 'Untitled'}" status changed to ${status}`,
          taskId: task.id,
          projectId: task.projectId
        }
      })

      return {
        id: task.id,
        projectId: task.projectId,
        userId: task.userId,
        createdBy: task.createdBy,
        completedAt: task.completedAt,
        assignedTo: task.assignedTo,
        status: task.status,
        label: task.label,
        dueDate: task.dueDate,
        endDate: task.endDate,
        attachments: task.attachments,
        createdAt: task.createdAt,
        assignee: task.user,
        project: task.project
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      throw new Error('Failed to update task status')
    }
  }
}