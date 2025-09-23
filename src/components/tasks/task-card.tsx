"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  MoreHorizontal, 
  Calendar, 
  Clock, 
  User, 
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Circle,
  Flag,
  Edit,
  Trash2
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
}

interface TaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onStatusChange?: (taskId: string, status: Task["status"]) => void
  onAssigneeChange?: (taskId: string, assigneeId: string | null) => void
}

export function TaskCard({ 
  task, 
  onEdit, 
  onDelete, 
  onStatusChange, 
  onAssigneeChange 
}: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "in-progress":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200"
      case "medium":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "in-progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getPriorityIcon = (priority: string) => {
    if (priority === "critical" || priority === "high") {
      return <Flag className="h-3 w-3" />
    }
    return null
  }

  const isOverdue = task.timelineEnd && new Date(task.timelineEnd) < new Date() && task.status !== "done"
  const isDueSoon = task.timelineEnd && 
    new Date(task.timelineEnd) <= new Date(Date.now() + 24 * 60 * 60 * 1000) && 
    task.status !== "done"

  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-md cursor-pointer group",
        isOverdue && "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20",
        isDueSoon && !isOverdue && "border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2 flex-1">
              {getStatusIcon(task.status)}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm leading-tight line-clamp-2">
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              {getPriorityIcon(task.priority)}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                      "h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
                      isHovered && "opacity-100"
                    )}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit?.(task)}>
                    <Edit className="mr-2 h-3 w-3" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete?.(task.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-3 w-3" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Labels */}
          {task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.labels.slice(0, 3).map((label) => (
                <Badge key={label} variant="outline" className="text-xs h-5">
                  {label}
                </Badge>
              ))}
              {task.labels.length > 3 && (
                <Badge variant="outline" className="text-xs h-5">
                  +{task.labels.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-3">
              {/* Project */}
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="truncate max-w-20">{task.project.name}</span>
              </div>
              
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
            <div className="flex items-center space-x-2">
              {/* Priority Badge */}
              <Badge className={cn("text-xs h-5", getPriorityColor(task.priority))}>
                {task.priority}
              </Badge>
              
              {/* Status Badge */}
              <Badge className={cn("text-xs h-5", getStatusColor(task.status))}>
                {task.status.replace("-", " ")}
              </Badge>
            </div>

            {/* Assignee */}
            <div className="flex items-center space-x-2">
              {task.assignee ? (
                <div className="flex items-center space-x-1">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={task.assignee.image || ""} alt={task.assignee.name} />
                    <AvatarFallback className="text-xs">
                      {task.assignee.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground truncate max-w-16">
                    {task.assignee.name}
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span className="text-xs">Unassigned</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {task.estimatedHours && task.estimatedHours > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{Math.round((task.loggedHours / task.estimatedHours) * 100)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div 
                  className="bg-primary h-1.5 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min((task.loggedHours / task.estimatedHours) * 100, 100)}%` 
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
