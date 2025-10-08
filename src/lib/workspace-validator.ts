/**
 * Workspace Access Validation Helper
 * Provides reusable functions to validate workspace access across all APIs
 */

import { prisma } from './db'

export class WorkspaceValidator {
  /**
   * Validates that a user belongs to a workspace
   * @throws Error if user not found or not assigned to workspace
   */
  static async validateUserWorkspace(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { workspaceId: true }
    })

    if (!user || !user.workspaceId) {
      throw new Error('User not found or not assigned to workspace')
    }

    return user.workspaceId
  }

  /**
   * Validates that a task belongs to the user's workspace
   * @throws Error if task not found or not in user's workspace
   */
  static async validateTaskAccess(taskId: string, userId: string): Promise<void> {
    const userWorkspaceId = await this.validateUserWorkspace(userId)

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          workspaceId: userWorkspaceId
        }
      }
    })

    if (!task) {
      throw new Error('Task not found or access denied')
    }
  }

  /**
   * Validates that a project belongs to the user's workspace
   * @throws Error if project not found or not in user's workspace
   */
  static async validateProjectAccess(projectId: string, userId: string): Promise<void> {
    const userWorkspaceId = await this.validateUserWorkspace(userId)

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        workspaceId: userWorkspaceId
      }
    })

    if (!project) {
      throw new Error('Project not found or access denied')
    }
  }

  /**
   * Validates that target user belongs to same workspace as requesting user
   * @throws Error if target user not found or in different workspace
   */
  static async validateSameWorkspace(requestingUserId: string, targetUserId: string): Promise<void> {
    const requestingUserWorkspaceId = await this.validateUserWorkspace(requestingUserId)

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { workspaceId: true }
    })

    if (!targetUser || targetUser.workspaceId !== requestingUserWorkspaceId) {
      throw new Error('Cannot access users from other workspaces')
    }
  }

  /**
   * Validates that a workspace exists and user has access to it
   * @throws Error if workspace not found or user doesn't have access
   */
  static async validateWorkspaceAccess(workspaceId: string, userId: string): Promise<void> {
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { ownerId: userId },
          { 
            workspaceMembers: {
              some: { userId: userId }
            }
          }
        ]
      }
    })

    if (!workspace) {
      throw new Error('Workspace not found or access denied')
    }
  }

  /**
   * Checks if user is admin in their workspace
   * @returns boolean indicating if user is admin
   */
  static async isWorkspaceAdmin(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    return user?.role === 'ADMIN'
  }

  /**
   * Gets all data scoped to user's workspace (for list endpoints)
   * Returns workspace ID that can be used in WHERE clauses
   */
  static async getWorkspaceScopeFilter(userId: string): Promise<{ workspaceId: string }> {
    const workspaceId = await this.validateUserWorkspace(userId)
    return { workspaceId }
  }

  /**
   * Validates that a comment belongs to a task in user's workspace
   * @throws Error if comment not found or not in user's workspace
   */
  static async validateCommentAccess(commentId: string, userId: string): Promise<void> {
    const userWorkspaceId = await this.validateUserWorkspace(userId)

    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        task: {
          project: {
            workspaceId: userWorkspaceId
          }
        }
      }
    })

    if (!comment) {
      throw new Error('Comment not found or access denied')
    }
  }

  /**
   * Validates that a time log belongs to a task in user's workspace
   * @throws Error if time log not found or not in user's workspace
   */
  static async validateTimeLogAccess(timeLogId: string, userId: string): Promise<void> {
    const userWorkspaceId = await this.validateUserWorkspace(userId)

    const timeLog = await prisma.timeLog.findFirst({
      where: {
        id: timeLogId,
        task: {
          project: {
            workspaceId: userWorkspaceId
          }
        }
      }
    })

    if (!timeLog) {
      throw new Error('Time log not found or access denied')
    }
  }
}
