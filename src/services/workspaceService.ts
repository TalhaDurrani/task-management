import { prisma } from '@/lib/db'
import { generateJoinCode } from '@/lib/code-generator'

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

      // Users can only see workspaces they own or are members of
      const whereClause = {
        OR: [
          { ownerId: userId },
          { id: user.workspaceId || 'none' },
          { members: { some: { id: userId } } }
        ]
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
          OR: [
            { ownerId: userId },
            { id: user.workspaceId || 'none' },
            { members: { some: { id: userId } } }
          ]
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
          joinCode: generateJoinCode(),
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

      // Get workspace members with their workspace-specific roles
      const workspaceMembers = await prisma.workspaceMember.findMany({
        where: { workspaceId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true
            }
          }
        },
        orderBy: {
          joinedAt: 'desc'
        }
      })

      // Transform to match expected format
      return workspaceMembers.map(member => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        role: member.role, // This is the workspace-specific role
        createdAt: member.user.createdAt,
        joinedAt: member.joinedAt
      }))
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

      if (!admin) {
        throw new Error('Admin user not found')
      }

      // Check if admin has permission (must be ADMIN globally OR workspace admin/owner)
      const adminMembership = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: adminUserId,
            workspaceId: workspaceId
          }
        }
      })

      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId }
      })

      if (!workspace) {
        throw new Error('Workspace not found')
      }

      // Admin must be either global ADMIN or workspace ADMIN/owner
      const isWorkspaceOwner = workspace.ownerId === adminUserId
      const isWorkspaceAdmin = adminMembership?.role === 'ADMIN'
      const isGlobalAdmin = admin.role === 'ADMIN'

      if (!isGlobalAdmin && !isWorkspaceAdmin && !isWorkspaceOwner) {
        throw new Error('Access denied: Only workspace admins or owners can add users')
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Check if user is already a member of this workspace
      const existingMembership = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: userId,
            workspaceId: workspaceId
          }
        }
      })

      if (existingMembership) {
        throw new Error('User is already a member of this workspace')
      }

      // Use transaction to ensure both updates happen atomically
      await prisma.$transaction([
        // Update user's current workspaceId
        prisma.user.update({
          where: { id: userId },
          data: { workspaceId }
        }),
        // Create WorkspaceMember record with MEMBER role (default)
        prisma.workspaceMember.create({
          data: {
            userId: userId,
            workspaceId: workspaceId,
            role: 'MEMBER' // New members always start as MEMBER
          }
        })
      ])

      return { success: true }
    } catch (error) {
      console.error('Error adding user to workspace:', error)
      throw error instanceof Error ? error : new Error('Failed to add user to workspace')
    }
  }

  static async removeUserFromWorkspace(workspaceId: string, userId: string, adminUserId: string) {
    try {
      const admin = await prisma.user.findUnique({
        where: { id: adminUserId }
      })

      if (!admin) {
        throw new Error('Admin user not found')
      }

      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId }
      })

      if (!workspace) {
        throw new Error('Workspace not found')
      }

      // ✅ PROTECTION: Prevent removing workspace owner
      if (userId === workspace.ownerId) {
        throw new Error('Cannot remove workspace owner')
      }

      // Check admin permissions
      const adminMembership = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: adminUserId,
            workspaceId: workspaceId
          }
        }
      })

      const isWorkspaceOwner = workspace.ownerId === adminUserId
      const isWorkspaceAdmin = adminMembership?.role === 'ADMIN'
      const isGlobalAdmin = admin.role === 'ADMIN'

      if (!isGlobalAdmin && !isWorkspaceAdmin && !isWorkspaceOwner) {
        throw new Error('Access denied: Only workspace admins or owners can remove users')
      }

      // Remove user from workspace in transaction
      await prisma.$transaction([
        // Delete WorkspaceMember record
        prisma.workspaceMember.delete({
          where: {
            userId_workspaceId: {
              userId: userId,
              workspaceId: workspaceId
            }
          }
        }),
        // Clear user's workspaceId if this was their active workspace
        prisma.user.updateMany({
          where: {
            id: userId,
            workspaceId: workspaceId
          },
          data: {
            workspaceId: null
          }
        })
      ])

      return { success: true }
    } catch (error) {
      console.error('Error removing user from workspace:', error)
      throw error instanceof Error ? error : new Error('Failed to remove user from workspace')
    }
  }
}
