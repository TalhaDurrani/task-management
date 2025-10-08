import { prisma } from '@/lib/db'
import type { CreateTaskData, UpdateTaskData } from "@/types"
import { StatusService } from './statusService'
import { TypeService } from './typeService'
import { Status, StatusCategory } from '@prisma/client'

// Simple status mapping functions
const mapStatusToDb = (status: string): 'TODO' | 'IN_PROGRESS' | 'DONE' => {
  switch (status?.toLowerCase()) {
    case 'todo':
      return 'TODO'
    case 'in-progress':
      return 'IN_PROGRESS'
    case 'done':
      return 'DONE'
    default:
      return 'TODO' // Default fallback
  }
}

const mapStatusFromDb = (status: string): 'todo' | 'in-progress' | 'done' => {
  switch (status?.toUpperCase()) {
    case 'TODO':
      return 'todo'
    case 'IN_PROGRESS':
      return 'in-progress'
    case 'DONE':
      return 'done'
    default:
      return 'todo' // Default fallback
  }
}

export class TaskService {
  static async getTasks(projectId: string, userId: string) {
    try {
      // Get the user's workspace
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { workspaceId: true, }
      })

      if (!user || !user.workspaceId ) {
        throw new Error('User not assigned to workspace')
      }

      // Check if user has access to the project (same workspace)
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          workspaceId: user.workspaceId,
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
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          assignees: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
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
          subTasks: {
            orderBy: {
              createdAt: 'asc'
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
          attachments: {
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
              uploadedAt: 'desc'
            }
          },
          customFields: {
            include: {
              customField: true
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
        type: task.type || 'task',
        customType: task.type, // Include custom type
        projectId: task.projectId,
        createdBy: task.createdBy,
        completedAt: task.completedAt,
        priority: task.priority.toLowerCase(),
        status: task.status,
        customStatus: task.customStatus, // Include custom status name
        statusCategory: task.statusCategory, // Include status category
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        creator: task.creator,
        assignees: task.assignees.map(ta => ta.user),
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
        subTasks: task.subTasks.map(subTask => ({
          id: subTask.id,
          taskId: subTask.taskId,
          title: subTask.title,
          description: subTask.description,
          completed: subTask.completed,
          createdAt: subTask.createdAt,
          updatedAt: subTask.updatedAt
        })),
        timeLogs: task.timeLogs.map(timeLog => ({
          id: timeLog.id,
          taskId: timeLog.taskId,
          userId: timeLog.userId,
          logDate: timeLog.logDate,
          hours: timeLog.hoursSpent,
          description: timeLog.description,
          createdAt: timeLog.createdAt,
          user: timeLog.user
        })),
        attachments: task.attachments.map(attachment => ({
          id: attachment.id,
          taskId: attachment.taskId,
          fileName: attachment.fileName,
          filePath: attachment.filePath,
          fileSize: attachment.fileSize,
          mimeType: attachment.mimeType,
          uploadedBy: attachment.uploadedBy,
          uploadedAt: attachment.uploadedAt,
          user: attachment.user
        })),
        customFields: task.customFields.map(tcf => ({
          id: tcf.id,
          taskId: tcf.taskId,
          customFieldId: tcf.customFieldId,
          value: tcf.value,
          customField: tcf.customField
        }))
      }))
    } catch (error) {
      console.error('Error in TaskService.getTasks:', error)
      throw error
    }
  }

  static async getTask(taskId: string, userId: string) {
    try {
      // Get the user's workspace
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { workspaceId: true, }
      })

      if (!user || !user.workspaceId ) {
        throw new Error('User not assigned to workspace')
      }

      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          project: {
            workspaceId: user.workspaceId,
            }
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          assignees: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
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
          subTasks: {
            orderBy: {
              createdAt: 'asc'
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
          attachments: {
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
              uploadedAt: 'desc'
            }
          },
          customFields: {
            include: {
              customField: true
            }
          }
        }
      })

      if (!task) {
        throw new Error('Task not found or access denied')
      }

      return {
        id: task.id,
        title: task.title,
        description: task.description,
        type: task.type || 'task',
        customType: task.type, // Include custom type
        projectId: task.projectId,
        createdBy: task.createdBy,
        completedAt: task.completedAt,
        priority: task.priority.toLowerCase(),
        status: mapStatusToDb(task.status),
        customStatus: task.customStatus, // Include custom status name
        statusCategory: task.statusCategory, // Include status category
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        creator: task.creator,
        assignees: task.assignees.map(ta => ta.user),
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
        subTasks: task.subTasks.map(subTask => ({
          id: subTask.id,
          taskId: subTask.taskId,
          title: subTask.title,
          description: subTask.description,
          completed: subTask.completed,
          createdAt: subTask.createdAt,
          updatedAt: subTask.updatedAt
        })),
        timeLogs: task.timeLogs.map(timeLog => ({
          id: timeLog.id,
          taskId: timeLog.taskId,
          userId: timeLog.userId,
          logDate: timeLog.logDate,
          hours: timeLog.hoursSpent,
          description: timeLog.description,
          createdAt: timeLog.createdAt,
          user: timeLog.user
        })),
        attachments: task.attachments.map(attachment => ({
          id: attachment.id,
          taskId: attachment.taskId,
          fileName: attachment.fileName,
          filePath: attachment.filePath,
          fileSize: attachment.fileSize,
          mimeType: attachment.mimeType,
          uploadedBy: attachment.uploadedBy,
          uploadedAt: attachment.uploadedAt,
          user: attachment.user
        })),
        customFields: task.customFields.map(tcf => ({
          id: tcf.id,
          taskId: tcf.taskId,
          customFieldId: tcf.customFieldId,
          value: tcf.value,
          customField: tcf.customField
        }))
      }
    } catch (error) {
      console.error('Error in TaskService.getTask:', error)
      throw error
    }
  }

  // Helper method to validate user and workspace
  private static async validateUserAndWorkspace(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { workspaceId: true, }
    })

    if (!user || !user.workspaceId ) {
      throw new Error('User not assigned to workspace')
    }

    return user
  }

  static async createTask(data: CreateTaskData, userId: string) {
    try {
      // Validate user and workspace
      const user = await this.validateUserAndWorkspace(userId)

      // Handle custom status creation if needed
      let customStatus = data.customStatus
      let statusCategory: StatusCategory = StatusCategory.BACKLOG

      if (data.customStatus && user.workspaceId) {
        // Convert frontend status category to Prisma enum
        const prismaStatusCategory = data.statusCategory ? 
          this.convertStatusCategoryToPrisma(data.statusCategory) : 
          StatusCategory.BACKLOG

        const createdStatus = await StatusService.createCustomStatus(
          user.workspaceId, 
          {
            name: data.customStatus,
            category: prismaStatusCategory
          }
        )
        customStatus = createdStatus.name
        statusCategory = createdStatus.category
      }

      // Handle custom type creation if needed
      let taskType = data.type || 'task' // Default type
      if (data.customType && user.workspaceId) {
        const createdType = await TypeService.createCustomType(
          user.workspaceId,
          {
            name: data.customType,
            color: '#6B7280' // Default color
          }
        )
        taskType = createdType.name
      }

      // Handle status conversion properly
      let taskStatus: Status = 'TODO' // Default
      if (data.status) {
        if (typeof data.status === 'string') {
          taskStatus = mapStatusToDb(data.status)
        } else if (typeof data.status === 'object' && 'name' in data.status) {
          taskStatus = mapStatusToDb(data.status.name)
        }
      }

      // Create task with comprehensive status and type management
      const task = await prisma.task.create({
        data: {
          title: data.title,
          description: data.description,
          projectId: data.projectId,
          createdBy: userId,
          status: taskStatus,
          customStatus: customStatus,
          statusCategory: statusCategory,
          priority: data.priority ? data.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' : 'MEDIUM',
          dueDate: data.dueDate,
          type: taskType
        },
        include: {
          project: { select: { id: true, title: true, description: true } },
          creator: { select: { id: true, name: true, email: true } },
          assignees: {
            include: {
              user: { select: { id: true, name: true, email: true } }
            }
          }
        }
      })

      // Handle assignees if provided
      if (data.assignees && data.assignees.length > 0) {
        await prisma.taskAssignee.createMany({
          data: data.assignees.map(userId => ({
            taskId: task.id,
            userId: userId
          }))
        })
      }

      // Handle custom fields if provided
      if (data.customFields && data.customFields.length > 0) {
        // Validate custom fields exist and belong to workspace
        const fieldIds = data.customFields.map(f => f.fieldId)
        const validFields = await prisma.customField.findMany({
          where: {
            id: { in: fieldIds },
            workspaceId: user.workspaceId
          }
        })

        if (validFields.length !== fieldIds.length) {
          throw new Error('One or more custom fields are invalid')
        }

        // Validate required fields
        const requiredFields = validFields.filter(f => f.isRequired)
        const providedFieldIds = data.customFields.map(f => f.fieldId)
        const missingRequired = requiredFields.filter(rf => !providedFieldIds.includes(rf.id))
        
        if (missingRequired.length > 0) {
          throw new Error(`Required fields missing: ${missingRequired.map(f => f.name).join(', ')}`)
        }

        // Create task custom field values
        const customFieldValues = data.customFields.map(cf => ({
          taskId: task.id,
          customFieldId: cf.fieldId,
          value: cf.value || null
        }))

        await prisma.taskCustomField.createMany({
          data: customFieldValues
        })
      }

      // Handle subtasks if provided
      if (data.subTasks && data.subTasks.length > 0) {
        await prisma.subTask.createMany({
          data: data.subTasks.map(st => ({
            taskId: task.id,
            title: st.title,
            description: st.description,
            completed: false
          }))
        })
      }

      // Handle attachments if provided
      if (data.attachments && data.attachments.length > 0) {
        await prisma.attachment.createMany({
          data: data.attachments.map(att => ({
            taskId: task.id,
            fileName: att.fileName,
            filePath: att.filePath,
            fileSize: att.fileSize,
            mimeType: att.mimeType,
            uploadedBy: userId
          }))
        })
      }

      return {
        id: task.id,
        title: task.title,
        description: task.description,
        status: mapStatusToDb(task.status),
        customStatus: task.customStatus,
        statusCategory: task.statusCategory,
        priority: task.priority.toLowerCase(),
        type: task.type,
        customType: task.type, // Include custom type
        createdAt: task.createdAt,
        completedAt: task.completedAt,
        dueDate: task.dueDate,
        project: task.project,
        creator: task.creator,
        assignees: task.assignees.map(a => a.user)
      }
    } catch (error) {
      console.error('Task creation error:', error)
      throw error
    }
  }

  // Helper method to convert frontend StatusCategory to Prisma StatusCategory
  private static convertStatusCategoryToPrisma(category: string): StatusCategory {
    switch (category) {
      case 'not-started':
        return StatusCategory.BACKLOG
      case 'in-progress':
        return StatusCategory.IN_PROGRESS
      case 'completed':
        return StatusCategory.COMPLETED
      default:
        return StatusCategory.BACKLOG
    }
  }

  static async updateTask(taskId: string, data: UpdateTaskData, userId: string) {
    try {
      // Get the user's workspace
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { workspaceId: true, }
      })

      if (!user || !user.workspaceId ) {
        throw new Error('User not assigned to workspace')
      }

      // Verify task access (same workspace)
      const existingTask = await prisma.task.findFirst({
        where: {
          id: taskId,
          project: {
            workspaceId: user.workspaceId,
            }
        }
      })

      if (!existingTask) {
        throw new Error('Task not found or access denied')
      }

      // Prepare update data with robust type conversion
      const updateData: any = {}

      // Handle title update
      if (data.title !== undefined) {
        updateData.title = data.title
      }

      // Handle description update
      if (data.description !== undefined) {
        updateData.description = data.description
      }

      // Handle status update with specific conversion
      if (data.status !== undefined) {
        updateData.status = typeof data.status === 'string' 
          ? data.status.toUpperCase() as 'TODO' | 'IN_PROGRESS' | 'DONE'
          : data.status?.name

        // Set completion timestamp for 'DONE' status
        updateData.completedAt = updateData.status === 'DONE' 
          ? new Date() 
          : null
      }

      // Handle priority update
      if (data.priority !== undefined) {
        updateData.priority = typeof data.priority === 'string'
          ? data.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
          : data.priority
      }

      // Handle due date update
      if (data.dueDate !== undefined) {
        updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
      }

      // Perform the update
      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: updateData,
        include: {
          project: {
            select: {
              id: true,
              title: true
            }
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          assignees: {
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

      // Return transformed task data
      return {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status.toLowerCase(),
        priority: updatedTask.priority.toLowerCase(),
        type: updatedTask.type,
        createdAt: updatedTask.createdAt,
        updatedAt: updatedTask.updatedAt,
        completedAt: updatedTask.completedAt,
        project: updatedTask.project,
        creator: updatedTask.creator,
        assignees: updatedTask.assignees.map(a => a.user)
      }
    } catch (error) {
      console.error('Error in TaskService.updateTask:', error)
      throw error
    }
  }

  // Advanced status update method
  static async updateTaskStatus(
    taskId: string, 
    newStatus: string, 
    userId: string,
    options?: { 
      customStatus?: string 
      force?: boolean 
    }
  ) {
    try {
      // Get the user's workspace for validation
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { workspaceId: true, }
      })

      if (!user || !user.workspaceId ) {
        throw new Error('User not assigned to workspace')
      }

      // Convert string status to enum - handle both UI and API formats
      let statusEnum: Status
      switch (newStatus.toLowerCase()) {
        case 'todo':
        case 'backlog':
          statusEnum = 'TODO'
          break
        case 'in-progress':
        case 'in_progress':
        case 'inprogress':
        case 'doing':
          statusEnum = 'IN_PROGRESS'
          break
        case 'done':
        case 'completed':
        case 'complete':
          statusEnum = 'DONE'
          break
        default:
          statusEnum = newStatus.toUpperCase() as Status || 'TODO'
      }

      // Fetch current task with access validation
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          project: {
            workspaceId: user.workspaceId,
            }
        },
        include: { 
          assignees: { 
            include: { user: true } 
          },
          project: { select: { id: true, title: true, description: true } },
          creator: { select: { id: true, name: true, email: true } }
        }
      })

      if (!task) {
        throw new Error('Task not found or access denied')
      }

      // For now, allow all status transitions by default (force = true by default)
      // This can be made configurable later if stricter validation is needed
      const shouldForceTransition = options?.force !== false

      // Validate status transition only if force is explicitly set to false
      if (!shouldForceTransition) {
        const isValidTransition = StatusService.validateStatusTransition(
          task.status, 
          statusEnum
        )

        if (!isValidTransition) {
          throw new Error(`Invalid status transition from ${task.status} to ${statusEnum}`)
        }
      }

      // Update task with comprehensive status management using transaction
      console.log(`🔄 Updating task ${taskId} status from ${task.status} to ${statusEnum}`)
      
      const result = await prisma.$transaction(async (tx) => {
        const updatedTask = await tx.task.update({
          where: { id: taskId },
          data: {
            status: statusEnum,
            customStatus: options?.customStatus,
            statusCategory: this.determineStatusCategory(statusEnum),
            completedAt: statusEnum === 'DONE' ? new Date() : (statusEnum === 'TODO' ? null : task.completedAt)
          },
          include: {
            project: { select: { id: true, title: true, description: true } },
            creator: { select: { id: true, name: true, email: true } },
            assignees: {
              include: {
                user: { select: { id: true, name: true, email: true } }
              }
            }
          }
        })

        console.log(`✅ Task ${taskId} updated successfully. New status: ${updatedTask.status}`)
        
        return updatedTask
      })
      
      // Verify the update was actually saved by querying the database again
      const verificationTask = await prisma.task.findUnique({
        where: { id: taskId },
        select: { id: true, status: true, completedAt: true }
      })
      
      console.log(`🔍 Verification query - Task ${taskId} status in DB: ${verificationTask?.status}`)
      
      const updatedTask = result

      // Return task in UI format - consistent with frontend expectations
      return {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status, // Convert to lowercase format
        customStatus: updatedTask.customStatus,
        statusCategory: updatedTask.statusCategory,
        priority: updatedTask.priority.toLowerCase(),
        type: updatedTask.type,
        createdAt: updatedTask.createdAt,
        completedAt: updatedTask.completedAt,
        dueDate: updatedTask.dueDate,
        project: updatedTask.project,
        creator: updatedTask.creator,
        assignees: updatedTask.assignees.map(a => a.user)
      }
    } catch (error) {
      console.error('Status update error:', error)
      throw error
    }
  }

  static async deleteTask(taskId: string, userId: string) {
    try {
      // Get the user's workspace
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { workspaceId: true, }
      })

      if (!user || !user.workspaceId ) {
        throw new Error('User not assigned to workspace')
      }

      // Verify task access (same workspace)
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          project: {
            workspaceId: user.workspaceId,
            }
        }
      })

      if (!task) {
        throw new Error('Task not found or access denied')
      }

      // Delete the task (cascade will handle related records)
      await prisma.task.delete({
        where: { id: taskId }
      })

      return { success: true }
    } catch (error) {
      console.error('Error in TaskService.deleteTask:', error)
      throw error
    }
  }

  // Get tasks assigned to a specific user
  static async getUserAssignedTasks(userId: string) {
    try {
      // Get user's workspace for proper isolation
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { workspaceId: true, }
      })

      if (!user || !user.workspaceId ) {
        throw new Error('User not assigned to workspace')
      }

      // Get all tasks assigned to this user in their workspace
      const tasks = await prisma.task.findMany({
        where: {
          assignees: {
            some: {
              userId: userId
            }
          },
          // Ensure tasks are from projects in the same workspace
          project: {
            workspaceId: user.workspaceId,
            }
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          assignees: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          project: {
            select: {
              id: true,
              title: true,
              description: true,
              workspace: {
                select: {
                  id: true,
                  name: true
                }
              }
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
        status: mapStatusToDb(task.status),
        customStatus: task.customStatus,
        statusCategory: task.statusCategory,
        priority: task.priority.toLowerCase(),
        type: task.type,
        createdAt: task.createdAt,
        completedAt: task.completedAt,
        dueDate: task.dueDate,
        project: task.project,
        creator: task.creator,
        assignees: task.assignees.map(a => a.user),
        comments: task.comments
      }))
    } catch (error) {
      console.error('Error in TaskService.getUserAssignedTasks:', error)
      throw error
    }
  }

  // Determine status category based on status
  private static determineStatusCategory(status: Status): StatusCategory {
    const categoryMap = {
      TODO: StatusCategory.BACKLOG,
      IN_PROGRESS: StatusCategory.IN_PROGRESS,
      DONE: StatusCategory.COMPLETED
    }
    return categoryMap[status]
  }

  // Existing helper method to map status
  private static mapStatusToDb(status: string): Status {
    switch (status.toLowerCase()) {
      case 'todo': return 'TODO'
      case 'in-progress': return 'IN_PROGRESS'
      case 'done': return 'DONE'
      default: return 'TODO'
    }
  }
}