import { prisma } from '@/lib/db'

export interface CreateOrganizationData {
  name: string
  description?: string
}

export interface UpdateOrganizationData extends Partial<CreateOrganizationData> {}

export class OrganizationService {
  static async getOrganizations(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { organization: true }
      })

      if (!user || user.role !== 'SUPER_ADMIN') {
        throw new Error('Access denied')
      }

      const organizations = await prisma.organization.findMany({
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          workspaces: {
            select: {
              id: true,
              name: true,
              description: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              users: true,
              workspaces: true,
              projects: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return organizations
    } catch (error) {
      console.error('Error fetching organizations:', error)
      throw new Error('Failed to fetch organizations')
    }
  }

  static async getOrganization(id: string, userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user || user.role !== 'SUPER_ADMIN') {
        throw new Error('Access denied')
      }

      const organization = await prisma.organization.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true
            }
          },
          workspaces: {
            include: {
              _count: {
                select: {
                  users: true,
                  projects: true
                }
              }
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
              }
            }
          }
        }
      })

      if (!organization) {
        throw new Error('Organization not found')
      }

      return organization
    } catch (error) {
      console.error('Error fetching organization:', error)
      throw new Error('Failed to fetch organization')
    }
  }

  static async createOrganization(data: CreateOrganizationData, userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user || user.role !== 'SUPER_ADMIN') {
        throw new Error('Only super admins can create organizations')
      }

      const organization = await prisma.organization.create({
        data: {
          name: data.name,
          description: data.description
        },
        include: {
          _count: {
            select: {
              users: true,
              workspaces: true,
              projects: true
            }
          }
        }
      })

      return organization
    } catch (error) {
      console.error('Error creating organization:', error)
      throw new Error('Failed to create organization')
    }
  }

  static async updateOrganization(id: string, data: UpdateOrganizationData, userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user || user.role !== 'SUPER_ADMIN') {
        throw new Error('Access denied')
      }

      const organization = await prisma.organization.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description
        },
        include: {
          _count: {
            select: {
              users: true,
              workspaces: true,
              projects: true
            }
          }
        }
      })

      return organization
    } catch (error) {
      console.error('Error updating organization:', error)
      throw new Error('Failed to update organization')
    }
  }

  static async deleteOrganization(id: string, userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user || user.role !== 'SUPER_ADMIN') {
        throw new Error('Access denied')
      }

      // Delete all related data
      await prisma.$transaction(async (tx) => {
        // Delete all projects and their related data
        const projects = await tx.project.findMany({
          where: { organizationId: id }
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
          where: { organizationId: id }
        })

        // Delete workspaces
        await tx.workspace.deleteMany({
          where: { organizationId: id }
        })

        // Remove users from organization
        await tx.user.updateMany({
          where: { organizationId: id },
          data: { organizationId: null, workspaceId: null }
        })

        // Delete organization
        await tx.organization.delete({
          where: { id }
        })
      })

      return { success: true }
    } catch (error) {
      console.error('Error deleting organization:', error)
      throw new Error('Failed to delete organization')
    }
  }
}
