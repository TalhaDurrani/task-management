import { prisma } from '@/lib/db'

export interface CreateCommentData {
  taskId: string
  content: string
}

export interface UpdateCommentData {
  content: string
}

export class CommentService {
  static async getComments(taskId: string, userId: string) {
    try {
      // ✅ PRIVACY FIX: Get user's workspace
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { workspaceId: true }
      })

      if (!user || !user.workspaceId) {
        throw new Error('User not found or not assigned to workspace')
      }

      // Check if user has access to the task (must be in same workspace)
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          project: {
            workspaceId: user.workspaceId
          }
        }
      })

      if (!task) {
        throw new Error('Task not found or access denied')
      }

      const comments = await prisma.comment.findMany({
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
        }
      })

      return comments.map(comment => ({
        id: comment.id,
        taskId: comment.taskId,
        userId: comment.userId,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        user: comment.user
      }))
    } catch (error) {
      console.error('Error fetching comments:', error)
      throw new Error('Failed to fetch comments')
    }
  }

  static async getComment(id: string, userId: string) {
    try {
      // ✅ PRIVACY FIX: Get user's workspace
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { workspaceId: true }
      })

      if (!user || !user.workspaceId) {
        throw new Error('User not found or not assigned to workspace')
      }

      const comment = await prisma.comment.findFirst({
        where: {
          id: id,
          task: {
            project: {
              workspaceId: user.workspaceId
            }
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
          },
          task: {
            select: {
              id: true,
              title: true,
              project: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        }
      })

      if (!comment) {
        throw new Error('Comment not found or access denied')
      }

      return {
        id: comment.id,
        taskId: comment.taskId,
        userId: comment.userId,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        user: comment.user,
        task: comment.task
      }
    } catch (error) {
      console.error('Error fetching comment:', error)
      throw new Error('Failed to fetch comment')
    }
  }

  static async createComment(data: CreateCommentData, userId: string) {
    try {
      // ✅ PRIVACY FIX: Get user's workspace
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { workspaceId: true }
      })

      if (!user || !user.workspaceId) {
        throw new Error('User not found or not assigned to workspace')
      }

      // Check if user has access to the task (must be in same workspace)
      const task = await prisma.task.findFirst({
        where: {
          id: data.taskId,
          project: {
            workspaceId: user.workspaceId
          }
        },
        include: {
          project: true
        }
      })

      if (!task) {
        throw new Error('Task not found or access denied')
      }

      const comment = await prisma.comment.create({
        data: {
          taskId: data.taskId,
          userId: userId,
          content: data.content
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
          type: 'comment_added',
          title: 'Comment Added',
          message: `Comment added to task "${task.title || 'Untitled'}"`,
          taskId: task.id,
          projectId: task.projectId
        }
      })

      return {
        id: comment.id,
        taskId: comment.taskId,
        userId: comment.userId,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        user: comment.user
      }
    } catch (error) {
      console.error('Error creating comment:', error)
      throw new Error('Failed to create comment')
    }
  }

  static async updateComment(id: string, data: UpdateCommentData, userId: string) {
    try {
      // ✅ PRIVACY FIX: Get user's workspace
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { workspaceId: true }
      })

      if (!user || !user.workspaceId) {
        throw new Error('User not found or not assigned to workspace')
      }

      // Check if user has access to the comment and is the author
      const existingComment = await prisma.comment.findFirst({
        where: {
          id: id,
          userId: userId,
          task: {
            project: {
              workspaceId: user.workspaceId
            }
          }
        },
        include: {
          task: {
            include: {
              project: true
            }
          }
        }
      })

      if (!existingComment || !existingComment.task) {
        throw new Error('Comment not found or access denied')
      }

      const comment = await prisma.comment.update({
        where: { id: id },
        data: {
          content: data.content
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
          type: 'comment_updated',
          title: 'Comment Updated',
          message: `Comment updated on task "${existingComment.task.title || 'Untitled'}"`,
          taskId: existingComment.task.id,
          projectId: existingComment.task.projectId
        }
      })

      return {
        id: comment.id,
        taskId: comment.taskId,
        userId: comment.userId,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        user: comment.user
      }
    } catch (error) {
      console.error('Error updating comment:', error)
      throw new Error('Failed to update comment')
    }
  }

  static async deleteComment(id: string, userId: string) {
    try {
      // ✅ PRIVACY FIX: Get user's workspace
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { workspaceId: true }
      })

      if (!user || !user.workspaceId) {
        throw new Error('User not found or not assigned to workspace')
      }

      // Check if user has access to the comment and is the author
      const existingComment = await prisma.comment.findFirst({
        where: {
          id: id,
          userId: userId,
          task: {
            project: {
              workspaceId: user.workspaceId
            }
          }
        },
        include: {
          task: {
            include: {
              project: true
            }
          }
        }
      })

      if (!existingComment || !existingComment.task) {
        throw new Error('Comment not found or access denied')
      }

      await prisma.comment.delete({
        where: { id: id }
      })

      // Create activity log
      await prisma.activity.create({
        data: {
          userId: userId,
          type: 'comment_deleted',
          title: 'Comment Deleted',
          message: `Comment deleted from task "${existingComment.task.title || 'Untitled'}"`,
          taskId: existingComment.task.id,
          projectId: existingComment.task.projectId
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error deleting comment:', error)
      throw new Error('Failed to delete comment')
    }
  }
}