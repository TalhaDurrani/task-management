"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, User, Tag, Plus, MessageSquare } from "lucide-react"
import { format } from "date-fns"
import { LogTimeDialog } from "./log-time-dialog"
import { CommentThread } from "@/components/comments/comment-thread"
import type { TaskStatus, TaskPriority } from "@/types"

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

interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  labels: string[]
  assignee: {
    id: string
    name: string | null
    email: string
    image: string | null
  } | null
  estimatedHours: number | null
  loggedHours: number
  timelineStart: Date | null
  timelineEnd: Date | null
  createdAt: Date
  updatedAt: Date
  comments: Comment[]
}

interface TaskDetailDialogProps {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
}

const priorityColors = {
  low: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200",
  critical: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200",
}

const statusColors = {
  todo: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200",
  done: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200",
}

export function TaskDetailDialog({ task, open, onOpenChange }: TaskDetailDialogProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return "Not set"
    return format(new Date(date), "PPP")
  }

  const getTimeProgress = () => {
    if (!task.estimatedHours) return null
    return Math.min((task.loggedHours / task.estimatedHours) * 100, 100)
  }

  const timeProgress = getTimeProgress()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{task.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge className={statusColors[task.status]} variant="secondary">
              {task.status.replace("_", " ")}
            </Badge>
            <Badge className={priorityColors[task.priority]} variant="secondary">
              {task.priority} priority
            </Badge>
          </div>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="comments" className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Comments ({task.comments.length})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              {task.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{task.description}</p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Assignee:</span>
                    {task.assignee ? (
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={task.assignee.image || ""} />
                          <AvatarFallback className="text-xs">
                            {task.assignee.name?.[0] || task.assignee.email[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{task.assignee.name || task.assignee.email}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Unassigned</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Time:</span>
                      </div>
                      <LogTimeDialog taskId={task.id} taskTitle={task.title}>
                        <Button size="sm" variant="outline">
                          <Plus className="h-3 w-3 mr-1" />
                          Log Time
                        </Button>
                      </LogTimeDialog>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Logged: {task.loggedHours}h</span>
                        {task.estimatedHours && <span>Estimated: {task.estimatedHours}h</span>}
                      </div>
                      {timeProgress !== null && (
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              timeProgress > 100 ? "bg-destructive" : timeProgress > 80 ? "bg-yellow-500" : "bg-primary"
                            }`}
                            style={{ width: `${Math.min(timeProgress, 100)}%` }}
                          />
                        </div>
                      )}
                      {timeProgress !== null && (
                        <p className="text-xs text-muted-foreground">
                          {timeProgress.toFixed(1)}% of estimated time
                          {timeProgress > 100 && " (over budget)"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Start:</span>
                    <span className="text-sm text-muted-foreground">{formatDate(task.timelineStart)}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Due:</span>
                    <span className="text-sm text-muted-foreground">{formatDate(task.timelineEnd)}</span>
                  </div>
                </div>
              </div>

              {task.labels.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Labels:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {task.labels.map((label) => (
                        <Badge key={label} variant="outline">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div className="text-xs text-muted-foreground">
                <p>Created: {format(new Date(task.createdAt), "PPP 'at' p")}</p>
                <p>Updated: {format(new Date(task.updatedAt), "PPP 'at' p")}</p>
              </div>
            </TabsContent>

            <TabsContent value="comments">
              <CommentThread
                comments={task.comments}
                taskId={task.id}
                onCommentAdded={() => {
                  // Refresh the dialog content or handle comment updates
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
