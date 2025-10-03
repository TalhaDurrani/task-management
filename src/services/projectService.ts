import { prisma } from '@/lib/db'
import type { CreateProjectData, UpdateProjectData } from "@/types"

export class ProjectService {
  static async getProjects(userId: string) {
    try {
      // Get user's workspace
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { workspaceId: true, }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // If user is not assigned to workspace, return empty array
      if (!user.workspaceId) {
        return []
      }

      const projects = await prisma.project.findMany({
        where: {
          workspaceId: user.workspaceId,
          // Remove the OR condition - users should see all projects in their workspace
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
          tasks: {
            include: {
              creator: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return projects.map(project => ({
        id: project.id,
        title: project.title,
        description: project.description,
        projectName: project.projectName,
        projectDocument: project.projectDocument,
        ownerId: project.userId,
        createdBy: project.createdBy,
        createdAt: project.createdAt,
        completedAt: project.completedAt,
        noOfAssignedUsers: project.noOfAssignedUsers,
        owner: project.user,
        tasks: project.tasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          projectId: task.projectId,
          createdBy: task.createdBy,
          completedAt: task.completedAt,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
          createdAt: task.createdAt,
          creator: task.creator
        }))
      }))
    } catch (error) {
      console.error('Error fetching projects:', error)
      throw new Error('Failed to fetch projects')
    }
  }

  static async getProject(id: string, userId: string) {
    try {
      // First get the user's workspace
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { workspaceId: true, }
      })

      if (!user || !user.workspaceId ) {
        throw new Error('User not assigned to workspace')
      }

      const project = await prisma.project.findFirst({
        where: {
          id: id,
          workspaceId: user.workspaceId,
          // Users should be able to access any project in their workspace
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
           tasks: {
             include: {
               creator: {
                 select: {
                   id: true,
                   name: true,
                   email: true
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
          }
        }
      })

      if (!project) {
        throw new Error('Project not found')
      }

      return {
        id: project.id,
        title: project.title,
        description: project.description,
        projectName: project.projectName,
        projectDocument: project.projectDocument,
        ownerId: project.userId,
        createdBy: project.createdBy,
        createdAt: project.createdAt,
        completedAt: project.completedAt,
        noOfAssignedUsers: project.noOfAssignedUsers,
        owner: project.user,
         tasks: project.tasks.map(task => ({
           id: task.id,
           title: task.title,
           description: task.description,
           projectId: task.projectId,
           createdBy: task.createdBy,
           completedAt: task.completedAt,
           status: task.status,
           priority: task.priority,
           dueDate: task.dueDate,
           createdAt: task.createdAt,
           creator: task.creator,
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
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      throw new Error('Failed to fetch project')
    }
  }

  static async createProject(data: CreateProjectData, userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          workspaceId: true,
          role: true
        }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Use the workspaceId from data if provided (for admin creating in any workspace)
      // Otherwise use user's workspaceId
      const targetWorkspaceId = data.workspaceId || user.workspaceId

      if (!targetWorkspaceId) {
        throw new Error('User must be assigned to a workspace to create projects. Please contact your administrator.')
      }

      // Verify workspace exists
      const workspace = await prisma.workspace.findUnique({
        where: { id: targetWorkspaceId }
      })

      if (!workspace) {
        throw new Error('Workspace not found')
      }

      const project = await prisma.project.create({
        data: {
          title: data.title,
          description: data.description,
          projectName: data.projectName,
          projectDocument: data.projectDocument,
          userId: userId,
          createdBy: userId,
          workspaceId: targetWorkspaceId,
          noOfAssignedUsers: 1
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
          type: 'project_created',
          title: 'Project Created',
          message: `Project "${project.title}" was created`,
          projectId: project.id
        }
      })

      return {
        id: project.id,
        title: project.title,
        description: project.description,
        projectName: project.projectName,
        projectDocument: project.projectDocument,
        ownerId: project.userId,
        createdBy: project.createdBy,
        createdAt: project.createdAt,
        completedAt: project.completedAt,
        noOfAssignedUsers: project.noOfAssignedUsers,
        owner: project.user,
        tasks: []
      }
    } catch (error) {
      console.error('Error creating project:', error)
      throw new Error('Failed to create project')
    }
  }

  static async updateProject(id: string, data: UpdateProjectData, userId: string) {
    try {
      // Check if user has access to this project
      const existingProject = await prisma.project.findFirst({
        where: {
          id: id,
          OR: [
            { userId: userId },
            { createdBy: userId }
          ]
        }
      })

      if (!existingProject) {
        throw new Error('Project not found or access denied')
      }

      const project = await prisma.project.update({
        where: { id: id },
        data: {
          title: data.title,
          description: data.description,
          projectName: data.projectName,
          projectDocument: data.projectDocument,
          completedAt: data.completedAt
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
          tasks: {
            include: {
              creator: {
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

      // Create activity log
      await prisma.activity.create({
        data: {
          userId: userId,
          type: 'project_updated',
          title: 'Project Updated',
          message: `Project "${project.title}" was updated`,
          projectId: project.id
        }
      })

      return {
        id: project.id,
        title: project.title,
        description: project.description,
        projectName: project.projectName,
        projectDocument: project.projectDocument,
        ownerId: project.userId,
        createdBy: project.createdBy,
        createdAt: project.createdAt,
        completedAt: project.completedAt,
        noOfAssignedUsers: project.noOfAssignedUsers,
        owner: project.user,
         tasks: project.tasks.map(task => ({
           id: task.id,
           title: task.title,
           description: task.description,
           projectId: task.projectId,
           createdBy: task.createdBy,
           completedAt: task.completedAt,
           status: task.status,
           priority: task.priority,
           dueDate: task.dueDate,
           createdAt: task.createdAt,
           creator: task.creator
         }))
      }
    } catch (error) {
      console.error('Error updating project:', error)
      throw new Error('Failed to update project')
    }
  }

  static async deleteProject(id: string, userId: string) {
    try {
      // Check if user has access to this project
      const existingProject = await prisma.project.findFirst({
        where: {
          id: id,
          OR: [
            { userId: userId },
            { createdBy: userId }
          ]
        }
      })

      if (!existingProject) {
        throw new Error('Project not found or access denied')
      }

      // Delete related data first
      await prisma.comment.deleteMany({
        where: {
          task: {
            projectId: id
          }
        }
      })

      await prisma.timeLog.deleteMany({
        where: {
          task: {
            projectId: id
          }
        }
      })

      await prisma.subTask.deleteMany({
        where: {
          task: {
            projectId: id
          }
        }
      })

      await prisma.task.deleteMany({
        where: {
          projectId: id
        }
      })

      await prisma.activity.deleteMany({
        where: {
          projectId: id
        }
      })

      await prisma.project.delete({
        where: { id: id }
      })

      return { success: true }
    } catch (error) {
      console.error('Error deleting project:', error)
      throw new Error('Failed to delete project')
    }
  }
}