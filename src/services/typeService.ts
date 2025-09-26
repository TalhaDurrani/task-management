import { prisma } from '@/lib/db'

export class TypeService {
  // Create a custom task type for a workspace
  static async createCustomType(
    workspaceId: string, 
    typeData: {
      name: string
      color?: string
    }
  ) {
    try {
      // Check if custom type with same name already exists in workspace
      const existingType = await prisma.customType.findUnique({
        where: {
          name_workspaceId: {
            name: typeData.name,
            workspaceId: workspaceId
          }
        }
      })

      if (existingType) {
        console.log(`Custom type "${typeData.name}" already exists for workspace`)
        return existingType
      }

      // Create new custom type
      const customType = await prisma.customType.create({
        data: {
          workspaceId: workspaceId,
          name: typeData.name,
          color: typeData.color || '#6B7280' // Default gray color
        }
      })

      // Log the type creation activity
      await this.logTypeCreation(workspaceId, customType.name)

      return {
        id: customType.id,
        name: customType.name,
        color: customType.color
      }
    } catch (error) {
      console.error('Type creation error:', error)
      throw error
    }
  }

  // Get workspace custom types
  static async getWorkspaceTypes(workspaceId: string) {
    try {
      // Default task types
      const defaultTypes = [
        { name: 'task', color: '#3B82F6' },
        { name: 'bug', color: '#EF4444' },
        { name: 'feature', color: '#10B981' },
        { name: 'story', color: '#F59E0B' },
        { name: 'epic', color: '#8B5CF6' }
      ]

      // Custom types for the workspace
      const customTypes = await prisma.customType.findMany({
        where: { workspaceId },
        select: { 
          id: true,
          name: true, 
          color: true 
        },
        orderBy: { createdAt: 'asc' }
      })

      return {
        default: defaultTypes,
        custom: customTypes
      }
    } catch (error) {
      console.error('Error fetching workspace types:', error)
      throw error
    }
  }

  // Update a custom type
  static async updateCustomType(
    typeId: string,
    workspaceId: string,
    updateData: {
      name?: string
      color?: string
    }
  ) {
    try {
      // Verify the type belongs to the workspace
      const existingType = await prisma.customType.findFirst({
        where: {
          id: typeId,
          workspaceId: workspaceId
        }
      })

      if (!existingType) {
        throw new Error('Custom type not found or access denied')
      }

      const updatedType = await prisma.customType.update({
        where: { id: typeId },
        data: updateData
      })

      return {
        id: updatedType.id,
        name: updatedType.name,
        color: updatedType.color
      }
    } catch (error) {
      console.error('Type update error:', error)
      throw error
    }
  }

  // Delete a custom type
  static async deleteCustomType(typeId: string, workspaceId: string) {
    try {
      // Verify the type belongs to the workspace
      const existingType = await prisma.customType.findFirst({
        where: {
          id: typeId,
          workspaceId: workspaceId
        }
      })

      if (!existingType) {
        throw new Error('Custom type not found or access denied')
      }

      // Check if any tasks are using this custom type
      const tasksUsingType = await prisma.task.count({
        where: {
          type: existingType.name,
          project: {
            workspaceId: workspaceId
          }
        }
      })

      if (tasksUsingType > 0) {
        throw new Error(`Cannot delete type "${existingType.name}" - it is being used by ${tasksUsingType} task(s)`)
      }

      await prisma.customType.delete({
        where: { id: typeId }
      })

      return { success: true, message: `Custom type "${existingType.name}" deleted successfully` }
    } catch (error) {
      console.error('Type deletion error:', error)
      throw error
    }
  }

  // Log type creation activity
  private static async logTypeCreation(workspaceId: string, typeName: string) {
    try {
      await prisma.activity.create({
        data: {
          type: 'type_created',
          title: 'Custom Type Created',
          message: `Custom type "${typeName}" was created`,
          userId: null // System activity
        }
      })
    } catch (error) {
      console.error('Error logging type creation:', error)
      // Don't throw - logging failure shouldn't prevent type creation
    }
  }
}
