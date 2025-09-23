"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { MoreHorizontal, Reply, Edit, Trash } from "lucide-react"
interface Comment {
  id: string
  content: string
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  replies: Comment[]
}

interface CommentThreadProps {
  comments: Comment[]
  taskId: string
  onCommentAdded?: () => void
}

export function CommentThread({ comments, taskId, onCommentAdded }: CommentThreadProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [newComment, setNewComment] = useState("")
  const [replyContent, setReplyContent] = useState("")
  const [editContent, setEditContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'GET'
        })
        const result = await response.json()
        
        if (result.success && result.user) {
          setCurrentUser(result.user)
        }
      } catch (error) {
        console.error('Failed to load user:', error)
      }
    }
    
    loadUser()
  }, [])

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newComment }),
      })

      if (!response.ok) {
        throw new Error("Failed to add comment")
      }

      setNewComment("")
      toast({
        title: "Success",
        description: "Comment added successfully",
      })
      router.refresh()
      onCommentAdded?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: replyContent, parentId }),
      })

      if (!response.ok) {
        throw new Error("Failed to add reply")
      }

      setReplyContent("")
      setReplyingTo(null)
      toast({
        title: "Success",
        description: "Reply added successfully",
      })
      router.refresh()
      onCommentAdded?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add reply",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: editContent }),
      })

      if (!response.ok) {
        throw new Error("Failed to update comment")
      }

      setEditContent("")
      setEditingComment(null)
      toast({
        title: "Success",
        description: "Comment updated successfully",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update comment",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete comment")
      }

      toast({
        title: "Success",
        description: "Comment deleted successfully",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      })
    }
  }

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`space-y-3 ${isReply ? "ml-8 border-l-2 border-muted pl-4" : ""}`}>
      <div className="flex items-start space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.user.image || ""} />
          <AvatarFallback className="text-xs">{comment.user.name?.[0] || comment.user.email[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-sm">{comment.user.name || comment.user.email}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                {comment.createdAt !== comment.updatedAt && " (edited)"}
              </span>
            </div>
            {currentUser?.id === comment.user.id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setEditingComment(comment.id)
                      setEditContent(comment.content)
                    }}
                  >
                    <Edit className="mr-2 h-3 w-3" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeleteComment(comment.id)} className="text-destructive">
                    <Trash className="mr-2 h-3 w-3" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {editingComment === comment.id ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Edit your comment..."
                className="min-h-[60px]"
              />
              <div className="flex space-x-2">
                <Button size="sm" onClick={() => handleEditComment(comment.id)} disabled={isSubmitting}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingComment(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(comment.id)}
                  className="h-6 px-2 text-xs"
                >
                  <Reply className="mr-1 h-3 w-3" />
                  Reply
                </Button>
              )}
            </>
          )}

          {replyingTo === comment.id && (
            <div className="space-y-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="min-h-[60px]"
              />
              <div className="flex space-x-2">
                <Button size="sm" onClick={() => handleReply(comment.id)} disabled={isSubmitting}>
                  Reply
                </Button>
                <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} isReply />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h4 className="font-medium">Comments ({comments.length})</h4>
        <div className="space-y-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="min-h-[80px]"
          />
          <Button onClick={handleAddComment} disabled={isSubmitting || !newComment.trim()}>
            {isSubmitting ? "Adding..." : "Add Comment"}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No comments yet. Be the first to add a comment!
          </p>
        )}
      </div>
    </div>
  )
}
