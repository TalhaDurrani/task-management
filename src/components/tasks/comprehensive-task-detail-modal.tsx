'use client'

import React, { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  CalendarIcon, 
  Clock, 
  Paperclip, 
  MessageSquare, 
  CheckSquare,
  Users,
  Edit2,
  Trash2,
  Copy,
  Archive,
  Share2,
  X,
  Plus,
  Star,
  Download,
  Upload
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

// Types
interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
}

interface CustomField {
  id: string
  customFieldId: string
  value: string | null
  customField: {
    id: string
    name: string
    type: 'TEXT' | 'NUMBER' | 'DROPDOWN' | 'MULTI_SELECT' | 'BOOLEAN' | 'DATE' | 'USER' | 'EMAIL' | 'URL' | 'TEXTAREA' | 'CHECKBOX' | 'RATING'
    description?: string
    options?: string
    placeholder?: string
    isRequired: boolean
    min?: number
    max?: number
  }
}

interface Subtask {
  id: string
  title: string
  description?: string
  completed: boolean
  createdAt: Date
  updatedAt: Date
}

interface Comment {
  id: string
  content: string
  createdAt: Date
  updatedAt: Date
  user: User
}

interface Attachment {
  id: string
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  uploadedAt: Date
  uploadedBy: string
  user: User
}

interface TimeLog {
  id: string
  hours: number
  description?: string
  logDate: Date
  createdAt: Date
  user: User
}

interface TaskDetail {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  customStatus?: string
  statusCategory?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  type: string
  customType?: string
  assignees: User[]
  createdBy?: User
  creator?: User  // API sometimes returns 'creator' instead of 'createdBy'
  createdAt: Date
  updatedAt: Date
  dueDate?: Date
  projectId?: string
  project?: {
    id: string
    title: string
    description?: string
  }
  customFields?: CustomField[]
  subtasks?: Subtask[]
  comments?: Comment[]
  attachments?: Attachment[]
  timeLogs?: TimeLog[]
}

interface ComprehensiveTaskDetailModalProps {
  taskId: string
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
}

export const ComprehensiveTaskDetailModal: React.FC<ComprehensiveTaskDetailModalProps> = ({
  taskId,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Form states
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)
  const [newCommentText, setNewCommentText] = useState('')
  const [isPostingComment, setIsPostingComment] = useState(false)
  const [commentFiles, setCommentFiles] = useState<FileList | null>(null)
  const [timeLogHours, setTimeLogHours] = useState('')
  const [timeLogDescription, setTimeLogDescription] = useState('')
  const [isLoggingTime, setIsLoggingTime] = useState(false)

  // Load task details
  useEffect(() => {
    if (isOpen && taskId) {
      loadTaskDetails()
    }
  }, [isOpen, taskId])

  const loadTaskDetails = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tasks/${taskId}`)
      if (response.ok) {
        const data = await response.json()
        // Normalize API response - handle both 'creator' and 'createdBy'
        if (data.creator && !data.createdBy) {
          data.createdBy = data.creator
        }
        setTask(data)
      }
    } catch (error) {
      console.error('Error loading task:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdate = async (updates: Partial<TaskDetail>) => {
    try {
      console.log('Updating task with:', updates)
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      if (response.ok) {
        const updatedTask = await response.json()
        console.log('Task updated successfully:', updatedTask)
        // Normalize API response - handle both 'creator' and 'createdBy'
        if (updatedTask.creator && !updatedTask.createdBy) {
          updatedTask.createdBy = updatedTask.creator
        }
        // Update local state immediately
        setTask(updatedTask)
        onUpdate?.()
      } else {
        const error = await response.json()
        console.error('Failed to update task:', error)
        alert(`Failed to update task: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating task:', error)
      alert('Error updating task. Please try again.')
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          onClose()
          onUpdate?.()
        }
      } catch (error) {
        console.error('Error deleting task:', error)
      }
    }
  }

  const handleDuplicate = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/duplicate`, {
        method: 'POST'
      })
      if (response.ok) {
        onUpdate?.()
      }
    } catch (error) {
      console.error('Error duplicating task:', error)
    }
  }

  // Subtask handlers
  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return
    
    setIsAddingSubtask(true)
    try {
      console.log('Adding subtask:', newSubtaskTitle.trim())
      const response = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newSubtaskTitle.trim() })
      })
      
      if (response.ok) {
        const newSubtask = await response.json()
        console.log('Subtask added successfully:', newSubtask)
        setNewSubtaskTitle('')
        await loadTaskDetails()
      } else {
        const error = await response.json()
        console.error('Failed to add subtask:', error)
        alert(`Failed to add subtask: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error adding subtask:', error)
      alert('Error adding subtask. Please try again.')
    } finally {
      setIsAddingSubtask(false)
    }
  }

  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
      })
      
      if (response.ok) {
        await loadTaskDetails()
      }
    } catch (error) {
      console.error('Error toggling subtask:', error)
    }
  }

  // Comment handlers
  const handlePostComment = async () => {
    if (!newCommentText.trim() && !commentFiles) return
    
    setIsPostingComment(true)
    try {
      console.log('Posting comment:', newCommentText.trim())
      
      // Post comment first
      const commentResponse = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newCommentText.trim() || '(File attached)' })
      })
      
      if (!commentResponse.ok) {
        const error = await commentResponse.json()
        console.error('Failed to post comment:', error)
        alert(`Failed to post comment: ${error.error || 'Unknown error'}`)
        return
      }

      const newComment = await commentResponse.json()
      console.log('Comment posted successfully:', newComment)
      
      // Upload files if any
      if (commentFiles && commentFiles.length > 0) {
        console.log('Uploading', commentFiles.length, 'file(s)...')
        for (let i = 0; i < commentFiles.length; i++) {
          const file = commentFiles[i]
          const formData = new FormData()
          formData.append('file', file)
          formData.append('fileName', file.name)
          formData.append('fileSize', file.size.toString())
          formData.append('mimeType', file.type)
          
          const uploadResponse = await fetch(`/api/tasks/${taskId}/attachments`, {
            method: 'POST',
            body: formData
          })
          
          if (!uploadResponse.ok) {
            console.error('Failed to upload file:', file.name)
          } else {
            console.log('File uploaded successfully:', file.name)
          }
        }
      }
      
      // Clear form
      setNewCommentText('')
      setCommentFiles(null)
      // Reset file input
      const fileInput = document.getElementById('comment-file-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      
      await loadTaskDetails()
    } catch (error) {
      console.error('Error posting comment:', error)
      alert('Error posting comment. Please try again.')
    } finally {
      setIsPostingComment(false)
    }
  }

  // Time log handlers
  const handleLogTime = async () => {
    const hours = parseFloat(timeLogHours)
    if (!hours || hours <= 0) return
    
    setIsLoggingTime(true)
    try {
      const response = await fetch(`/api/tasks/${taskId}/time-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          hoursSpent: hours,
          description: timeLogDescription.trim() || undefined
        })
      })
      
      if (response.ok) {
        setTimeLogHours('')
        setTimeLogDescription('')
        await loadTaskDetails()
      }
    } catch (error) {
      console.error('Error logging time:', error)
    } finally {
      setIsLoggingTime(false)
    }
  }

  // Custom field handler
  const handleCustomFieldUpdate = async (customFieldId: string, value: any) => {
    try {
      console.log('Updating custom field:', customFieldId, value)
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customFields: [{
            customFieldId,
            value: value?.toString() || null
          }]
        })
      })
      
      if (response.ok) {
        console.log('Custom field updated successfully')
        await loadTaskDetails()
      } else {
        const error = await response.json()
        console.error('Failed to update custom field:', error)
      }
    } catch (error) {
      console.error('Error updating custom field:', error)
    }
  }

  if (isLoading || !task) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent showCloseButton={false} className="!max-w-[95vw] w-[95vw] max-h-[90vh]">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading task details...</div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Safely access arrays with fallbacks
  const subtasks = task.subtasks || []
  const comments = task.comments || []
  const attachments = task.attachments || []
  const timeLogs = task.timeLogs || []

  const completedSubtasks = subtasks.filter(st => st.completed).length
  const subtaskProgress = subtasks.length > 0 
    ? (completedSubtasks / subtasks.length) * 100 
    : 0

  const totalTimeLogged = timeLogs.reduce((sum, log) => sum + log.hours, 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="!max-w-[95vw] w-[95vw] max-h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {task.customType || task.type}
                  </Badge>
                  {task.project && (
                    <Badge 
                      variant="secondary" 
                      className="text-xs"
                    >
                      {task.project.title}
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-2xl mb-2">
                  {isEditing ? (
                    <Input 
                      value={task.title}
                      onChange={(e) => setTask({...task, title: e.target.value})}
                      className="text-2xl font-semibold"
                    />
                  ) : (
                    task.title
                  )}
                </DialogTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Created by {task.createdBy?.name || task.creator?.name || 'Unknown'}</span>
                  <span>•</span>
                  <span>{format(new Date(task.createdAt), 'MMM d, yyyy')}</span>
                  {task.dueDate && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        Due {format(new Date(task.dueDate), 'MMM d, yyyy')}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleDuplicate}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-10 h-full">
              {/* Left Column - Main Content */}
              <div className="col-span-7 border-r">
                <ScrollArea className="h-[calc(90vh-180px)]">
                  <div className="p-6 space-y-6">
                    {/* Description */}
                    <div>
                      <Label className="text-sm font-semibold">Description</Label>
                      {isEditing ? (
                        <Textarea 
                          value={task.description || ''}
                          onChange={(e) => setTask({...task, description: e.target.value})}
                          placeholder="Add a description..."
                          className="mt-2 min-h-[100px]"
                        />
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                          {task.description || 'No description provided'}
                        </p>
                      )}
                    </div>

                    <Separator />

                    {/* Custom Fields */}
                    {task.customFields && task.customFields.length > 0 && (
                      <>
                        <div>
                          <Label className="text-sm font-semibold mb-4 block">Custom Fields</Label>
                          <div className="space-y-4">
                            {(task.customFields || []).map((cf) => (
                              <CustomFieldRenderer 
                                key={cf.id} 
                                customField={cf}
                                isEditing={isEditing}
                                onUpdate={(value) => handleCustomFieldUpdate(cf.customFieldId, value)}
                              />
                            ))}
                          </div>
                        </div>
                        <Separator />
                      </>
                    )}

                    {/* Subtasks */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                          <CheckSquare className="h-4 w-4" />
                          Subtasks ({completedSubtasks}/{subtasks.length})
                        </Label>
                      </div>
                      {subtasks.length > 0 && (
                        <Progress value={subtaskProgress} className="mb-4" />
                      )}
                      <div className="space-y-2 mb-3">
                        {subtasks.map((subtask) => (
                          <div key={subtask.id} className="flex items-center gap-2 p-2 rounded hover:bg-accent">
                            <Checkbox 
                              checked={subtask.completed}
                              onCheckedChange={(checked) => handleToggleSubtask(subtask.id, checked as boolean)}
                            />
                            <span className={cn(
                              "flex-1 text-sm",
                              subtask.completed && "line-through text-muted-foreground"
                            )}>
                              {subtask.title}
                            </span>
                          </div>
                        ))}
                        {subtasks.length === 0 && (
                          <p className="text-sm text-muted-foreground mb-2">No subtasks yet</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a subtask..."
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleAddSubtask()
                            }
                          }}
                        />
                        <Button 
                          size="sm" 
                          onClick={handleAddSubtask}
                          disabled={isAddingSubtask || !newSubtaskTitle.trim()}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Attachments */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                          <Paperclip className="h-4 w-4" />
                          Attachments ({attachments.length})
                        </Label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {attachments.map((attachment) => {
                          const isImage = attachment.mimeType.startsWith('image/')
                          const isPDF = attachment.mimeType === 'application/pdf'
                          
                          return (
                            <div key={attachment.id} className="group relative border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                              {/* Preview */}
                              {isImage ? (
                                <div className="aspect-video bg-muted relative">
                                  <img 
                                    src={attachment.filePath} 
                                    alt={attachment.fileName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      // Fallback if image fails to load
                                      e.currentTarget.style.display = 'none'
                                      e.currentTarget.parentElement!.innerHTML = `
                                        <div class="w-full h-full flex items-center justify-center">
                                          <svg class="w-12 h-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                        </div>
                                      `
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                    <a 
                                      href={attachment.filePath} 
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Button variant="secondary" size="sm">
                                        <Download className="h-4 w-4 mr-1" />
                                        View
                                      </Button>
                                    </a>
                                  </div>
                                </div>
                              ) : (
                                <div className="aspect-video bg-muted flex flex-col items-center justify-center p-4">
                                  {isPDF ? (
                                    <div className="text-red-600 mb-2">
                                      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h12l4 4v16H2v-1z"/>
                                        <text x="10" y="14" fontSize="8" textAnchor="middle" fill="currentColor">PDF</text>
                                      </svg>
                                    </div>
                                  ) : (
                                    <Paperclip className="h-12 w-12 text-muted-foreground mb-2" />
                                  )}
                                  <Button variant="outline" size="sm" asChild>
                                    <a href={attachment.filePath} download={attachment.fileName}>
                                      <Download className="h-3 w-3 mr-1" />
                                      Download
                                    </a>
                                  </Button>
                                </div>
                              )}
                              
                              {/* File Info */}
                              <div className="p-2 bg-background">
                                <p className="text-xs font-medium truncate" title={attachment.fileName}>
                                  {attachment.fileName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {(attachment.fileSize / 1024).toFixed(1)} KB • {attachment.user.name}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      
                      {attachments.length === 0 && (
                        <div className="text-center py-8 border-2 border-dashed rounded-lg">
                          <Paperclip className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No attachments yet</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Attach files when posting comments
                          </p>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Comments & Activity */}
                    <div>
                      <Label className="text-sm font-semibold flex items-center gap-2 mb-4">
                        <MessageSquare className="h-4 w-4" />
                        Comments ({comments.length})
                      </Label>
                      <div className="space-y-4 mb-4">
                        {comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={comment.user.avatarUrl} />
                              <AvatarFallback className="text-xs">
                                {comment.user.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">{comment.user.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                        {comments.length === 0 && (
                          <p className="text-sm text-muted-foreground">No comments yet</p>
                        )}
                      </div>
                      <div className="mt-4">
                        <Textarea 
                          placeholder="Add a comment..." 
                          className="min-h-[80px]"
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                              e.preventDefault()
                              handlePostComment()
                            }
                          }}
                        />
                        
                        {/* File Preview */}
                        {commentFiles && commentFiles.length > 0 && (
                          <div className="mt-3 p-3 border rounded-lg bg-muted/30">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium">Attached Files ({commentFiles.length})</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setCommentFiles(null)
                                  const fileInput = document.getElementById('comment-file-input') as HTMLInputElement
                                  if (fileInput) fileInput.value = ''
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {Array.from(commentFiles).map((file, index) => {
                                const isImage = file.type.startsWith('image/')
                                const fileUrl = URL.createObjectURL(file)
                                
                                return (
                                  <div key={index} className="relative group border rounded p-2 bg-background">
                                    {isImage ? (
                                      <div className="aspect-video relative rounded overflow-hidden bg-muted">
                                        <img 
                                          src={fileUrl} 
                                          alt={file.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    ) : (
                                      <div className="aspect-video flex items-center justify-center bg-muted rounded">
                                        <Paperclip className="h-8 w-8 text-muted-foreground" />
                                      </div>
                                    )}
                                    <p className="text-xs truncate mt-1" title={file.name}>{file.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center gap-2">
                            <input
                              id="comment-file-input"
                              type="file"
                              multiple
                              accept="image/*,.pdf,.doc,.docx,.txt"
                              className="hidden"
                              onChange={(e) => setCommentFiles(e.target.files)}
                            />
                            <Button 
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById('comment-file-input')?.click()}
                            >
                              <Paperclip className="h-4 w-4 mr-1" />
                              Attach Files
                            </Button>
                            <span className="text-xs text-muted-foreground">
                              Ctrl+Enter to post
                            </span>
                          </div>
                          <Button 
                            size="sm"
                            onClick={handlePostComment}
                            disabled={isPostingComment || (!newCommentText.trim() && !commentFiles)}
                          >
                            {isPostingComment ? 'Posting...' : 'Post Comment'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>

              {/* Right Column - Properties */}
              <div className="col-span-3">
                <ScrollArea className="h-[calc(90vh-180px)]">
                  <div className="p-6 space-y-6">
                    {/* Status */}
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground mb-2 block">STATUS</Label>
                      <Select 
                        value={task.customStatus || task.status}
                        onValueChange={(value) => handleUpdate({ status: value as 'TODO' | 'IN_PROGRESS' | 'DONE' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TODO">To Do</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="DONE">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Priority */}
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground mb-2 block">PRIORITY</Label>
                      <Select 
                        value={task.priority}
                        onValueChange={(value) => handleUpdate({ priority: value as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="CRITICAL">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Assignees */}
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        ASSIGNEES
                      </Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {task.assignees.map((user) => (
                          <div key={user.id} className="flex items-center gap-2 p-2 rounded border">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={user.avatarUrl} />
                              <AvatarFallback className="text-xs">
                                {user.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{user.name}</span>
                          </div>
                        ))}
                        {task.assignees.length === 0 && (
                          <p className="text-sm text-muted-foreground">Unassigned</p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground italic">
                        Note: Assignee management will be added in next update
                      </p>
                    </div>

                    {/* Due Date */}
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        DUE DATE
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {task.dueDate ? format(new Date(task.dueDate), 'PPP') : 'Set due date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={task.dueDate ? new Date(task.dueDate) : undefined}
                            onSelect={(date) => handleUpdate({ dueDate: date })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Time Tracking */}
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        TIME LOGGED
                      </Label>
                      <div className="p-3 rounded border">
                        <p className="text-2xl font-semibold">
                          {totalTimeLogged}h
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {timeLogs.length} time {timeLogs.length === 1 ? 'entry' : 'entries'}
                        </p>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="mt-2 w-full">
                            <Clock className="h-4 w-4 mr-1" />
                            Log Time
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-4">
                            <div>
                              <Label>Hours Spent</Label>
                              <Input
                                type="number"
                                step="0.25"
                                min="0"
                                placeholder="e.g., 2.5"
                                value={timeLogHours}
                                onChange={(e) => setTimeLogHours(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Description (optional)</Label>
                              <Textarea
                                placeholder="What did you work on?"
                                value={timeLogDescription}
                                onChange={(e) => setTimeLogDescription(e.target.value)}
                                className="min-h-[60px]"
                              />
                            </div>
                            <Button 
                              onClick={handleLogTime}
                              disabled={isLoggingTime || !timeLogHours}
                              className="w-full"
                            >
                              {isLoggingTime ? 'Logging...' : 'Log Time'}
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <Separator />

                    {/* Metadata */}
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Task ID: {task.id.substring(0, 8)}</p>
                      <p>Created: {format(new Date(task.createdAt), 'PPP')}</p>
                      <p>Updated: {format(new Date(task.updatedAt), 'PPP')}</p>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>

          {/* Footer */}
          {isEditing && (
            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                handleUpdate(task)
                setIsEditing(false)
              }}>
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Custom Field Renderer Component
interface CustomFieldRendererProps {
  customField: CustomField
  isEditing: boolean
  onUpdate: (value: any) => void
}

const CustomFieldRenderer: React.FC<CustomFieldRendererProps> = ({
  customField,
  isEditing,
  onUpdate
}) => {
  const { customField: field, value } = customField

  const renderField = () => {
    switch (field.type) {
      case 'TEXT':
        return isEditing ? (
          <Input 
            value={value || ''}
            onChange={(e) => onUpdate(e.target.value)}
            placeholder={field.placeholder}
          />
        ) : (
          <p className="text-sm">{value || '-'}</p>
        )

      case 'TEXTAREA':
        return isEditing ? (
          <Textarea 
            value={value || ''}
            onChange={(e) => onUpdate(e.target.value)}
            placeholder={field.placeholder}
            className="min-h-[80px]"
          />
        ) : (
          <p className="text-sm whitespace-pre-wrap">{value || '-'}</p>
        )

      case 'NUMBER':
        return isEditing ? (
          <Input 
            type="number"
            value={value || ''}
            onChange={(e) => onUpdate(e.target.value)}
            min={field.min}
            max={field.max}
            placeholder={field.placeholder}
          />
        ) : (
          <p className="text-sm">{value || '-'}</p>
        )

      case 'DROPDOWN':
        const options = field.options ? JSON.parse(field.options) : []
        return isEditing ? (
          <Select value={value || ''} onValueChange={onUpdate}>
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt: string) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-sm">{value || '-'}</p>
        )

      case 'MULTI_SELECT':
        const multiOptions = field.options ? JSON.parse(field.options) : []
        const selectedValues = value ? JSON.parse(value) : []
        return (
          <div className="flex flex-wrap gap-1">
            {selectedValues.map((val: string) => (
              <Badge key={val} variant="secondary">{val}</Badge>
            ))}
            {selectedValues.length === 0 && <span className="text-sm text-muted-foreground">-</span>}
          </div>
        )

      case 'BOOLEAN':
        return isEditing ? (
          <Checkbox 
            checked={value === 'true'}
            onCheckedChange={(checked) => onUpdate(checked.toString())}
          />
        ) : (
          <p className="text-sm">{value === 'true' ? 'Yes' : 'No'}</p>
        )

      case 'DATE':
        return isEditing ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => onUpdate(date?.toISOString())}
              />
            </PopoverContent>
          </Popover>
        ) : (
          <p className="text-sm">{value ? format(new Date(value), 'PPP') : '-'}</p>
        )

      case 'EMAIL':
        return isEditing ? (
          <Input 
            type="email"
            value={value || ''}
            onChange={(e) => onUpdate(e.target.value)}
            placeholder={field.placeholder}
          />
        ) : (
          <a href={`mailto:${value}`} className="text-sm text-blue-600 hover:underline">
            {value || '-'}
          </a>
        )

      case 'URL':
        return isEditing ? (
          <Input 
            type="url"
            value={value || ''}
            onChange={(e) => onUpdate(e.target.value)}
            placeholder={field.placeholder}
          />
        ) : (
          <a href={value || '#'} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
            {value || '-'}
          </a>
        )

      case 'RATING':
        const rating = parseInt(value || '0')
        return (
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-5 w-5 cursor-pointer",
                  star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                )}
                onClick={() => isEditing && onUpdate(star.toString())}
              />
            ))}
          </div>
        )

      case 'CHECKBOX':
        const checkboxOptions = field.options ? JSON.parse(field.options) : []
        const checkedValues = value ? JSON.parse(value) : []
        return (
          <div className="space-y-2">
            {checkboxOptions.map((opt: string) => (
              <div key={opt} className="flex items-center gap-2">
                <Checkbox 
                  checked={checkedValues.includes(opt)}
                  disabled={!isEditing}
                  onCheckedChange={(checked) => {
                    const newValues = checked
                      ? [...checkedValues, opt]
                      : checkedValues.filter((v: string) => v !== opt)
                    onUpdate(JSON.stringify(newValues))
                  }}
                />
                <Label className="text-sm">{opt}</Label>
              </div>
            ))}
          </div>
        )

      default:
        return <p className="text-sm text-muted-foreground">Unsupported field type</p>
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {field.name}
        {field.isRequired && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
      {renderField()}
    </div>
  )
}
