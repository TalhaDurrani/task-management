import { prisma } from '@/lib/db'

export interface CreateWorkspaceData {
  name: string
  description?: string
}

export interface UpdateWorkspaceData extends Partial<CreateWorkspaceData> {}

export class WorkspaceService {
  static async getWorkspaces(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Admins can see all workspaces
      // Regular users can only see workspaces they own or are assigned to
      let whereClause = {}
      
      if (user.role === 'ADMIN') {
        // Admins can see all workspaces
        whereClause = {}
      } else {
        // Regular users can see workspaces they own or are assigned to via workspaceId
        whereClause = {
          OR: [
            { ownerId: userId },
            { id: user.workspaceId || 'none' }
          ]
        }
      }

      const workspaces = await prisma.workspace.findMany({
        where: whereClause,
        include: {
          _count: {
            select: {
              projects: true,
              members: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return workspaces.map(workspace => ({
        ...workspace,
        _count: {
          ...workspace._count,
          users: workspace._count.members
        }
      }))
    } catch (error) {
      console.error('Error fetching workspaces:', error)
      throw new Error('Failed to fetch workspaces')
    }
  }

  static async getWorkspace(id: string, userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        throw new Error('User not found')
      }

      const workspace = await prisma.workspace.findFirst({
        where: {
          id,
          ...(user.role === 'MEMBER' ? { ownerId: userId } : {})
        },
        include: {
          projects: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              _count: {
                select: {
                  tasks: true
                }
              }
            }
          }
        }
      })

      if (!workspace) {
        throw new Error('Workspace not found or access denied')
      }

      return workspace
    } catch (error) {
      console.error('Error fetching workspace:', error)
      throw new Error('Failed to fetch workspace')
    }
  }

  static async createWorkspace(data: CreateWorkspaceData, userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Create workspace with the user as the owner and assign user to workspace
      const workspace = await prisma.workspace.create({
        data: {
          name: data.name,
          description: data.description,
          ownerId: userId,
          members: {
            connect: { id: userId }
          }
        },
        include: {
          _count: {
            select: {
              projects: true,
              members: true
            }
          }
        }
      })

      // Also update the user's workspaceId
      await prisma.user.update({
        where: { id: userId },
        data: { workspaceId: workspace.id }
      })

      return {
        ...workspace,
        _count: {
          ...workspace._count,
          users: workspace._count.members
        }
      }
    } catch (error) {
      console.error('Error creating workspace:', error)
      throw new Error('Failed to create workspace')
    }
  }

  static async updateWorkspace(id: string, data: UpdateWorkspaceData, userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user || user.role !== 'ADMIN') {
        throw new Error('Access denied')
      }

      const workspace = await prisma.workspace.findUnique({
        where: { id }
      })

      if (!workspace) {
        throw new Error('Workspace not found')
      }

      const updatedWorkspace = await prisma.workspace.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description
        },
        include: {
          _count: {
            select: {
              projects: true
            }
          }
        }
      })

      return updatedWorkspace
    } catch (error) {
      console.error('Error updating workspace:', error)
      throw new Error('Failed to update workspace')
    }
  }

  static async deleteWorkspace(id: string, userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user || user.role !== 'ADMIN') {
        throw new Error('Access denied')
      }

      const workspace = await prisma.workspace.findUnique({
        where: { id }
      })

      if (!workspace) {
        throw new Error('Workspace not found')
      }

      // Delete all related data
      await prisma.$transaction(async (tx) => {
        // Delete all projects and their related data
        const projects = await tx.project.findMany({
          where: { workspaceId: id }
        })

        for (const project of projects) {
          await tx.comment.deleteMany({
            where: { task: { projectId: project.id } }
          })
          await tx.timeLog.deleteMany({
            where: { task: { projectId: project.id } }
          })
          await tx.subTask.deleteMany({
            where: { task: { projectId: project.id } }
          })
          await tx.task.deleteMany({
            where: { projectId: project.id }
          })
        }

        await tx.project.deleteMany({
          where: { workspaceId: id }
        })

        // Remove users from workspace
        await tx.user.updateMany({
          where: { workspaceId: id },
          data: { workspaceId: null }
        })

        // Delete workspace
        await tx.workspace.delete({
          where: { id }
        })
      })

      return { success: true }
    } catch (error) {
      console.error('Error deleting workspace:', error)
      throw new Error('Failed to delete workspace')
    }
  }

  static async getWorkspaceUsers(workspaceId: string, userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        throw new Error('Access denied')
      }

      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId }
      })

      if (!workspace) {
        throw new Error('Workspace not found')
      }

      const users = await prisma.user.findMany({
        where: { workspaceId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return users
    } catch (error) {
      console.error('Error fetching workspace users:', error)
      throw new Error('Failed to fetch workspace users')
    }
  }

  static async addUserToWorkspace(workspaceId: string, userId: string, adminUserId: string) {
    try {
      const admin = await prisma.user.findUnique({
        where: { id: adminUserId }
      })

      if (!admin || admin.role !== 'ADMIN') {
        throw new Error('Access denied')
      }

      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId }
      })

      if (!workspace) {
        throw new Error('Workspace not found')
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        throw new Error('User not found')
      }

      await prisma.user.update({
        where: { id: userId },
        data: { workspaceId }
      })

      return { success: true }
    } catch (error) {
      console.error('Error adding user to workspace:', error)
      throw new Error('Failed to add user to workspace')
    }
  }

  static async removeUserFromWorkspace(workspaceId: string, userId: string, adminUserId: string) {
    try {
      const admin = await prisma.user.findUnique({
        where: { id: adminUserId }
      })

      if (!admin || admin.role !== 'ADMIN') {
        throw new Error('Access denied')
      }

      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId }
      })

      if (!workspace) {
        throw new Error('Workspace not found')
      }

      await prisma.user.update({
        where: { id: userId },
        data: { workspaceId: null }
      })

      return { success: true }
    } catch (error) {
      console.error('Error removing user from workspace:', error)
      throw new Error('Failed to remove user from workspace')
    }
  }
}
