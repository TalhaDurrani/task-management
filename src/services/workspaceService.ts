import { prisma } from '@/lib/db'

export interface CreateWorkspaceData {
  name: string
  description?: string
  organizationId: string
}

export interface UpdateWorkspaceData extends Partial<CreateWorkspaceData> {}

export class WorkspaceService {
  static async getWorkspaces(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { organization: true }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Super admins can see all workspaces across all organizations
      // Regular admins can see workspaces in their organization
      // Users can only see workspaces they're assigned to
      let whereClause = {}
      
      if (user.role === 'ADMIN') {
        // Super admins can see all workspaces
        whereClause = {}
      } else if (user.role === 'ADMIN') {
        // Admins can see workspaces in their organization
        if (!user.organizationId) {
          throw new Error('User not assigned to any organization')
        }
        whereClause = { }
      } else {
        // Regular users can only see workspaces they're assigned to
        if (!user.organizationId) {
          throw new Error('User not assigned to any organization')
        }
        whereClause = {
          users: { some: { id: userId } }
        }
      }

      const workspaces = await prisma.workspace.findMany({
        where: whereClause,
        include: {
          organization: {
            select: {
              id: true,
              name: true
            }
          },
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          _count: {
            select: {
              users: true,
              projects: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return workspaces
    } catch (error) {
      console.error('Error fetching workspaces:', error)
      throw new Error('Failed to fetch workspaces')
    }
  }

  static async getWorkspace(id: string, userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { organization: true }
      })

      if (!user ) {
        throw new Error('User not assigned to any organization')
      }

      const workspace = await prisma.workspace.findFirst({
        where: {
          id,
          ...(user.role === 'MEMBER' ? { users: { some: { id: userId } } } : {})
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true
            }
          },
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true
            }
          },
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
        where: { id: userId },
        include: { organization: true }
      })

      if (!user || user.role !== 'ADMIN' && user.role !== 'ADMIN') {
        throw new Error('Only admins can create workspaces')
      }

      if (user.role === 'ADMIN' && user.organizationId !== data.organizationId) {
        throw new Error('Access denied')
      }

      const workspace = await prisma.workspace.create({
        data: {
          name: data.name,
          description: data.description,
          organizationId: data.organizationId
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              users: true,
              projects: true
            }
          }
        }
      })

      return workspace
    } catch (error) {
      console.error('Error creating workspace:', error)
      throw new Error('Failed to create workspace')
    }
  }

  static async updateWorkspace(id: string, data: UpdateWorkspaceData, userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { organization: true }
      })

      if (!user || user.role !== 'ADMIN' && user.role !== 'ADMIN') {
        throw new Error('Access denied')
      }

      const workspace = await prisma.workspace.findFirst({
        where: {
          id,
          ...(user.role === 'ADMIN' ? { users: { some: { id: userId } } } : {})
        }
      })

      if (!workspace) {
        throw new Error('Workspace not found or access denied')
      }

      const updatedWorkspace = await prisma.workspace.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              users: true,
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
        where: { id: userId },
        include: { organization: true }
      })

      if (!user || user.role !== 'ADMIN' && user.role !== 'ADMIN') {
        throw new Error('Access denied')
      }

      const workspace = await prisma.workspace.findFirst({
        where: {
          id,
          ...(user.role === 'ADMIN' ? { users: { some: { id: userId } } } : {})
        }
      })

      if (!workspace) {
        throw new Error('Workspace not found or access denied')
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

  static async addUserToWorkspace(workspaceId: string, userId: string, adminUserId: string) {
    try {
      const admin = await prisma.user.findUnique({
        where: { id: adminUserId },
        include: { organization: true }
      })

      if (!admin || admin.role !== 'ADMIN' && admin.role !== 'ADMIN') {
        throw new Error('Access denied')
      }

      const workspace = await prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          organizationId: admin.organizationId
        }
      })

      if (!workspace) {
        throw new Error('Workspace not found')
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user || user.organizationId !== admin.organizationId) {
        throw new Error('User not found or not in same organization')
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
        where: { id: adminUserId },
        include: { organization: true }
      })

      if (!admin || admin.role !== 'ADMIN' && admin.role !== 'ADMIN') {
        throw new Error('Access denied')
      }

      const workspace = await prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          organizationId: admin.organizationId
        }
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
