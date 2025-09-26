import { prisma } from '@/lib/db'
import { z } from 'zod'
import { Status, StatusCategory } from '@prisma/client'

// Robust input validation
const CustomStatusSchema = z.object({
  name: z.string()
    .min(2, "Status name must be at least 2 characters")
    .max(50, "Status name cannot exceed 50 characters")
    .regex(/^[a-zA-Z0-9\s-]+$/, "Status name can only contain letters, numbers, spaces, and hyphens"),
  category: z.enum(['BACKLOG', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD']),
  color: z.string().optional()
})

export interface CustomStatusData {
  name: string
  category: StatusCategory
  color?: string
}

export class StatusService {
  // Create a new custom status with comprehensive validation
  static async createCustomStatus(
    workspaceId: string, 
    statusData: CustomStatusData
  ) {
    try {
      // Validate input
      const validatedData = CustomStatusSchema.parse(statusData)

      // Check for existing status (case-insensitive) in the CustomStatus table
      const existingStatus = await prisma.customStatus.findFirst({
        where: { 
          workspaceId: workspaceId,
          name: { 
            mode: 'insensitive', 
            equals: validatedData.name.trim() 
          }
        }
      })

      if (existingStatus) {
        throw new Error('Status already exists in this workspace')
      }

      // Create the custom status in the CustomStatus table
      const customStatus = await prisma.customStatus.create({
        data: {
          name: validatedData.name.trim().toUpperCase(),
          color: validatedData.color || '#34D399',
          category: validatedData.category,
          workspaceId: workspaceId
        }
      })

      // Log status creation
      await this.logStatusCreation(workspaceId, validatedData)

      return {
        name: customStatus.name,
        category: customStatus.category,
        color: customStatus.color
      }
    } catch (error) {
      console.error('Status creation error:', error)
      throw error
    }
  }

  // Fetch workspace statuses with advanced filtering
  static async getWorkspaceStatuses(
    workspaceId: string, 
    options?: {
      category?: StatusCategory
      includeDefault?: boolean
    }
  ) {
    const defaultStatuses = [
      { name: 'TODO', category: StatusCategory.BACKLOG },
      { name: 'IN_PROGRESS', category: StatusCategory.IN_PROGRESS },
      { name: 'DONE', category: StatusCategory.COMPLETED }
    ]

    const customStatuses = await prisma.task.findMany({
      where: { 
        project: { workspaceId },
        ...(options?.category ? { statusCategory: options.category } : {})
      },
      select: { 
        customStatus: true, 
        statusCategory: true 
      },
      distinct: ['customStatus', 'statusCategory']
    })

    // Combine and filter statuses
    const allStatuses = [
      ...(options?.includeDefault !== false ? defaultStatuses : []),
      ...customStatuses.map(s => ({
        name: s.customStatus!, 
        category: s.statusCategory
      }))
    ]

    return allStatuses
  }

  // Logging for audit trail
  private static async logStatusCreation(
    workspaceId: string, 
    statusData: CustomStatusData
  ) {
    // Since Activity doesn't have workspaceId, we'll just log the status creation
    await prisma.activity.create({
      data: {
        type: 'STATUS_CREATED',
        title: 'New Task Status Created',
        message: `Custom status "${statusData.name}" created in workspace ${workspaceId}`,
      }
    })
  }

  // Update a custom status
  static async updateCustomStatus(
    statusId: string,
    workspaceId: string,
    updateData: {
      name?: string
      color?: string
      category?: StatusCategory
    }
  ) {
    try {
      // Verify the status belongs to the workspace
      const existingStatus = await prisma.customStatus.findFirst({
        where: {
          id: statusId,
          workspaceId: workspaceId
        }
      })

      if (!existingStatus) {
        throw new Error('Custom status not found or access denied')
      }

      const updatedStatus = await prisma.customStatus.update({
        where: { id: statusId },
        data: updateData
      })

      return {
        id: updatedStatus.id,
        name: updatedStatus.name,
        color: updatedStatus.color,
        category: updatedStatus.category
      }
    } catch (error) {
      console.error('Status update error:', error)
      throw error
    }
  }

  // Delete a custom status
  static async deleteCustomStatus(statusId: string, workspaceId: string) {
    try {
      // Verify the status belongs to the workspace
      const existingStatus = await prisma.customStatus.findFirst({
        where: {
          id: statusId,
          workspaceId: workspaceId
        }
      })

      if (!existingStatus) {
        throw new Error('Custom status not found or access denied')
      }

      // Check if any tasks are using this custom status
      const tasksUsingStatus = await prisma.task.count({
        where: {
          customStatus: existingStatus.name,
          project: {
            workspaceId: workspaceId
          }
        }
      })

      if (tasksUsingStatus > 0) {
        throw new Error(`Cannot delete status "${existingStatus.name}" - it is being used by ${tasksUsingStatus} task(s)`)
      }

      await prisma.customStatus.delete({
        where: { id: statusId }
      })

      return { success: true, message: `Custom status "${existingStatus.name}" deleted successfully` }
    } catch (error) {
      console.error('Status deletion error:', error)
      throw error
    }
  }

  // Advanced status transition validation
  static validateStatusTransition(
    currentStatus: Status, 
    newStatus: Status
  ): boolean {
    const validTransitions = {
      TODO: ['IN_PROGRESS'],
      IN_PROGRESS: ['TODO', 'DONE'],
      DONE: ['IN_PROGRESS']
    }

    return validTransitions[currentStatus]?.includes(newStatus) || false
  }
}

