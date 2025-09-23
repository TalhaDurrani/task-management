"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Plus, 
  CheckCircle2,
  AlertCircle,
  Circle,
  Calendar,
  Clock,
  User
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  description: string | null
  status: "todo" | "in-progress" | "done"
  priority: "low" | "medium" | "high" | "critical"
  labels: string[]
  projectId: string
  project: {
    id: string
    name: string
  }
  assigneeId: string | null
  assignee: {
    id: string
    name: string
    email: string
    image?: string
  } | null
  timelineStart: Date | null
  timelineEnd: Date | null
  estimatedHours: number | null
  loggedHours: number
  createdAt: Date
  updatedAt: Date
  storyPoints?: number
  issueType?: "story" | "bug" | "task" | "epic"
  sprintId?: string
}

interface SimpleKanbanProps {
  tasks: Task[]
  onTaskMove?: (taskId: string, newStatus: Task["status"]) => void
  onTaskEdit?: (task: Task) => void
  onTaskDelete?: (taskId: string) => void
  onCreateTask?: (status: Task["status"]) => void
}

const columns = [
  {
    id: "todo" as const,
    title: "To Do",
    color: "bg-gray-100 dark:bg-gray-800",
    icon: Circle,
  },
  {
    id: "in-progress" as const,
    title: "In Progress", 
    color: "bg-yellow-100 dark:bg-yellow-900",
    icon: AlertCircle,
  },
  {
    id: "done" as const,
    title: "Done",
    color: "bg-green-100 dark:bg-green-900",
    icon: CheckCircle2,
  }
]

export function SimpleKanban({ 
  tasks, 
  onTaskMove, 
  onTaskEdit, 
  onTaskDelete, 
  onCreateTask 
}: SimpleKanbanProps) {
  // Group tasks by status
  const tasksByStatus = tasks.reduce((acc, task) => {
    if (!acc[task.status]) {
      acc[task.status] = []
    }
    acc[task.status].push(task)
    return acc
  }, {} as Record<string, Task[]>)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const getIssueTypeIcon = (type?: string) => {
    switch (type) {
      case "bug":
        return "🐛"
      case "story":
        return "📖"
      case "epic":
        return "🎯"
      default:
        return "📋"
    }
  }

  return (
    <div className="flex space-x-6 overflow-x-auto pb-6">
      {columns.map((column) => {
        const columnTasks = tasksByStatus[column.id] || []
        const Icon = column.icon

        return (
          <div key={column.id} className="flex-shrink-0 w-80">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={cn("p-1.5 rounded-md", column.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm font-medium">
                      {column.title}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {columnTasks.length}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCreateTask?.(column.id)}
                    className="h-6 w-6 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 min-h-96">
                {columnTasks.map((task) => {
                  const isOverdue = task.timelineEnd && new Date(task.timelineEnd) < new Date() && task.status !== "done"
                  const isDueSoon = task.timelineEnd && 
                    new Date(task.timelineEnd) <= new Date(Date.now() + 24 * 60 * 60 * 1000) && 
                    task.status !== "done"

                  return (
                    <Card
                      key={task.id}
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:shadow-md group",
                        isOverdue && "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20",
                        isDueSoon && !isOverdue && "border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20"
                      )}
                    >
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-2 flex-1">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-1 mb-1">
                                  <span className="text-xs">
                                    {getIssueTypeIcon(task.issueType)}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {task.project.name}
                                  </span>
                                </div>
                                <h4 className="font-medium text-sm leading-tight line-clamp-2">
                                  {task.title}
                                </h4>
                              </div>
                            </div>
                          </div>

                          {/* Labels */}
                          {task.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {task.labels.slice(0, 2).map((label) => (
                                <Badge key={label} variant="outline" className="text-xs h-4">
                                  {label}
                                </Badge>
                              ))}
                              {task.labels.length > 2 && (
                                <Badge variant="outline" className="text-xs h-4">
                                  +{task.labels.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Metadata */}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center space-x-2">
                              {/* Priority */}
                              <div className={cn("w-2 h-2 rounded-full", getPriorityColor(task.priority))} />
                              
                              {/* Story Points */}
                              {task.storyPoints && (
                                <Badge variant="outline" className="text-xs h-4">
                                  {task.storyPoints} pts
                                </Badge>
                              )}
                              
                              {/* Due Date */}
                              {task.timelineEnd && (
                                <div className={cn(
                                  "flex items-center space-x-1",
                                  isOverdue && "text-red-600 font-medium",
                                  isDueSoon && !isOverdue && "text-orange-600 font-medium"
                                )}>
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(task.timelineEnd).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>

                            {/* Hours */}
                            {task.estimatedHours && (
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{task.loggedHours}h/{task.estimatedHours}h</span>
                              </div>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              {/* Priority Badge */}
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs h-4",
                                  task.priority === "critical" && "border-red-200 text-red-800",
                                  task.priority === "high" && "border-orange-200 text-orange-800",
                                  task.priority === "medium" && "border-blue-200 text-blue-800"
                                )}
                              >
                                {task.priority}
                              </Badge>
                            </div>

                            {/* Assignee */}
                            {task.assignee ? (
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={task.assignee.image || ""} alt={task.assignee.name} />
                                <AvatarFallback className="text-xs">
                                  {task.assignee.name[0]}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                                <User className="h-2 w-2 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        )
      })}
    </div>
  )
}
