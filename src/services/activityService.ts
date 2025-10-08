import { prisma } from '@/lib/db'

export class ActivityService {
  static async getActivities(userId: string, limit: number = 50) {
    try {
      // ✅ PRIVACY FIX: Get user's workspace
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { workspaceId: true }
      })

      if (!user || !user.workspaceId) {
        throw new Error('User not found or not assigned to workspace')
      }

      const activities = await prisma.activity.findMany({
        where: {
          // Only get activities where the user is from the same workspace
          user: {
            workspaceId: user.workspaceId
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
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      })

      return activities.map(activity => ({
        id: activity.id,
        userId: activity.userId,
        type: activity.type,
        title: activity.title,
        message: activity.message,
        taskId: activity.taskId,
        projectId: activity.projectId,
        createdAt: activity.createdAt,
        user: activity.user
      }))
    } catch (error) {
      console.error('Error fetching activities:', error)
      throw new Error('Failed to fetch activities')
    }
  }

  static async getProjectActivities(projectId: string, userId: string, limit: number = 50) {
    try {
      // ✅ PRIVACY FIX: Get user's workspace
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { workspaceId: true }
      })

      if (!user || !user.workspaceId) {
        throw new Error('User not found or not assigned to workspace')
      }

      // Check if user has access to the project (must be in same workspace)
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          workspaceId: user.workspaceId
        }
      })

      if (!project) {
        throw new Error('Project not found or access denied')
      }

      const activities = await prisma.activity.findMany({
        where: {
          projectId: projectId
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
          createdAt: 'desc'
        },
        take: limit
      })

      return activities.map(activity => ({
        id: activity.id,
        userId: activity.userId,
        type: activity.type,
        title: activity.title,
        message: activity.message,
        taskId: activity.taskId,
        projectId: activity.projectId,
        createdAt: activity.createdAt,
        user: activity.user
      }))
    } catch (error) {
      console.error('Error fetching project activities:', error)
      throw new Error('Failed to fetch project activities')
    }
  }

  static async getTaskActivities(taskId: string, userId: string, limit: number = 50) {
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

      const activities = await prisma.activity.findMany({
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
          createdAt: 'desc'
        },
        take: limit
      })

      return activities.map(activity => ({
        id: activity.id,
        userId: activity.userId,
        type: activity.type,
        title: activity.title,
        message: activity.message,
        taskId: activity.taskId,
        projectId: activity.projectId,
        createdAt: activity.createdAt,
        user: activity.user
      }))
    } catch (error) {
      console.error('Error fetching task activities:', error)
      throw new Error('Failed to fetch task activities')
    }
  }

  static async createActivity(data: {
    userId: string
    type: string
    title: string
    message: string
    taskId?: string
    projectId?: string
  }) {
    try {
      const activity = await prisma.activity.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          taskId: data.taskId,
          projectId: data.projectId
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

      return {
        id: activity.id,
        userId: activity.userId,
        type: activity.type,
        title: activity.title,
        message: activity.message,
        taskId: activity.taskId,
        projectId: activity.projectId,
        createdAt: activity.createdAt,
        user: activity.user
      }
    } catch (error) {
      console.error('Error creating activity:', error)
      throw new Error('Failed to create activity')
    }
  }
}
