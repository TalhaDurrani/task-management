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
      // Check if user has access to the task
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          project: {
            OR: [
              { userId: userId },
              { createdBy: userId }
            ]
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
      const comment = await prisma.comment.findFirst({
        where: {
          id: id,
          task: {
            project: {
              OR: [
                { userId: userId },
                { createdBy: userId }
              ]
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
              label: true,
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
      // Check if user has access to the task
      const task = await prisma.task.findFirst({
        where: {
          id: data.taskId,
          project: {
            OR: [
              { userId: userId },
              { createdBy: userId }
            ]
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
          message: `Comment added to task "${task.label || 'Untitled'}"`,
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
      // Check if user has access to the comment and is the author
      const existingComment = await prisma.comment.findFirst({
        where: {
          id: id,
          userId: userId,
          task: {
            project: {
              OR: [
                { userId: userId },
                { createdBy: userId }
              ]
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

      if (!existingComment) {
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
          message: `Comment updated on task "${existingComment.task.label || 'Untitled'}"`,
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
      // Check if user has access to the comment and is the author
      const existingComment = await prisma.comment.findFirst({
        where: {
          id: id,
          userId: userId,
          task: {
            project: {
              OR: [
                { userId: userId },
                { createdBy: userId }
              ]
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

      if (!existingComment) {
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
          message: `Comment deleted from task "${existingComment.task.label || 'Untitled'}"`,
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