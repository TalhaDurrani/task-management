"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Plus,
  MoreHorizontal,
  Calendar,
  Clock,
  User,
  Flag,
  CheckCircle2,
  AlertCircle,
  Circle,
  Edit,
  Trash2,
  GripVertical,
  Grip,
  Columns,
  ChevronDown,
  Star,
  Zap,
  Target
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
interface Task {
  id: string
  title: string
  description: string | null
  status: number | string // Changed from literal union to support numeric statuses
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
  storyPoints?: number
  issueType?: "story" | "bug" | "task" | "epic"
  sprintId?: string
  customStatus?: string | null
  statusCategory?: string
}

interface WorkflowColumn {
  id: string
  title: string
  color: string
  limit?: number
}

interface Workflow {
  id: string
  projectId: string
  userId: string
  name: string
  columns: WorkflowColumn[]
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

interface KanbanBoardProps {
  tasks: Task[]
  onTaskMove?: (taskId: string, newStatus: string) => void
  onTaskEdit?: (task: Task) => void
  onTaskDelete?: (taskId: string) => void
  onCreateTask?: (status: string) => void
  onColumnReorder?: (columns: Array<{id: string | number, title: string, color: string, icon: any, count: number}>) => void
  workflows?: Workflow[]
  selectedWorkflowId?: string
  onWorkflowChange?: (workflowId: string) => void
}

const columns = [
  {
    id: "todo" as const,
    title: "To Do",
    color: "bg-gray-100 dark:bg-gray-800",
    icon: Circle,
    count: 0
  },
  {
    id: "in-progress" as const,
    title: "In Progress", 
    color: "bg-yellow-100 dark:bg-yellow-900",
    icon: AlertCircle,
    count: 0
  },
  {
    id: "done" as const,
    title: "Done",
    color: "bg-green-100 dark:bg-green-900",
    icon: CheckCircle2,
    count: 0
  }
]

export function KanbanBoard({
  tasks,
  onTaskMove,
  onTaskEdit,
  onTaskDelete,
  onCreateTask,
  onColumnReorder,
  workflows = [],
  selectedWorkflowId,
  onWorkflowChange
}: KanbanBoardProps): JSX.Element {
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [columnOrder, setColumnOrder] = useState<Array<{id: string | number, title: string, color: string, icon: any, count: number}>>([])

  // Get the selected workflow
  const selectedWorkflow = workflows.find(w => w.id === selectedWorkflowId)

  // Icon mapping helper
  const iconMap: Record<string, any> = {
    'Circle': Circle,
    'AlertCircle': AlertCircle,
    'CheckCircle2': CheckCircle2,
    'Star': Star,
    'Zap': Zap,
    'Target': Target,
    'Flag': Flag
  }

  // Convert workflow columns to kanban columns format
  const workflowColumns = selectedWorkflow?.columns.map((col: any) => ({
    id: col.id,
    title: col.title,
    color: col.color || '#6B7280',
    icon: iconMap[col.icon] || Circle,
    count: 0,
    category: col.category
  })) || columns

  const activeColumns = workflowColumns

  // Initialize column order and update when workflow changes
  useEffect(() => {
    if (activeColumns && activeColumns.length > 0) {
      setColumnOrder([...activeColumns])
    }
  }, [activeColumns, selectedWorkflowId])

  console.log('🎯 KANBAN BOARD DEBUG:', {
    totalTasks: tasks.length,
    columns: activeColumns.map(col => ({ id: col.id, title: col.title })),
    sampleTasks: tasks.slice(0, 3).map(t => ({ 
      id: t.id.slice(0, 8), 
      title: t.title,
      status: t.status, 
      customStatus: t.customStatus 
    }))
  })

  // IMPROVED GROUPING LOGIC - Works with both default and custom statuses
  const tasksByStatus = tasks.reduce((acc, task) => {
    const keys: string[] = []

    // RULE 1: If task has customStatus, use it as a key
    if (task.customStatus) {
      keys.push(task.customStatus)
    }
    
    // RULE 2: Always add numeric status as a key (for default columns)
    keys.push(String(task.status))

    // RULE 3: For default workflows, also map numeric to text keys
    // This ensures tasks show up in default "To Do", "In Progress", "Done" columns
    if (!task.customStatus) {
      switch (Number(task.status)) {
        case 1:
          keys.push('To Do')
          keys.push('Todo')
          keys.push('Backlog')
          break
        case 2:
          keys.push('In Progress')
          keys.push('In Development')
          break
        case 3:
          keys.push('Done')
          keys.push('Completed')
          break
      }
    }

    // Add task to all matching keys
    keys.forEach(key => {
      if (!acc[key]) {
        acc[key] = []
      }
      // Avoid duplicates in the same group
      if (!acc[key].some(t => t.id === task.id)) {
        acc[key].push(task)
      }
    })

    return acc
  }, {} as Record<string, Task[]>)

  console.log('📊 TASKS GROUPED:', Object.entries(tasksByStatus).map(([key, tasks]) => ({
    groupKey: key,
    taskCount: tasks.length,
    taskTitles: tasks.map(t => t.title).slice(0, 2)
  })))

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

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId)
    setDraggedColumn(null) // Clear any column drag state
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", taskId) // Set data to identify it's a task
    e.stopPropagation() // Prevent column drag from starting
  }

  const handleColumnDragStart = (e: React.DragEvent, columnId: string | number) => {
    setDraggedColumn(columnId.toString())
    setDraggedTask(null) // Clear any task drag state
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", `column-${columnId}`)
    e.stopPropagation()
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleColumnDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, columnId: string | number, columnTitle: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (draggedTask) {
      // SIMPLIFIED DROP LOGIC
      // Always pass the column title - parent will handle the mapping
      const statusValue = columnTitle
      
      console.log('🎯 TASK DROPPED:', { 
        taskId: draggedTask.slice(0, 8), 
        columnId, 
        columnTitle,
        statusValue 
      })
      
      onTaskMove?.(draggedTask, statusValue)
      setDraggedTask(null)
    }
  }

  const handleColumnDrop = (e: React.DragEvent, targetColumnId: string | number) => {
    e.preventDefault()
    e.stopPropagation()

    if (draggedColumn && draggedColumn !== targetColumnId.toString()) {
      const newOrder = [...columnOrder]
      const draggedIndex = newOrder.findIndex(col => col.id.toString() === draggedColumn)
      const targetIndex = newOrder.findIndex(col => col.id.toString() === targetColumnId.toString())

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const [removed] = newOrder.splice(draggedIndex, 1)
        newOrder.splice(targetIndex, 0, removed)
        setColumnOrder(newOrder)
        onColumnReorder?.(newOrder)
      }
    }
    setDraggedColumn(null)
  }

  return (
    <div className="flex space-x-6 overflow-x-auto pb-6">
      {columnOrder.map((column) => {
        // IMPROVED MATCHING LOGIC - Works with both default and custom workflows
        let columnTasks: Task[] = []
        
        // Strategy 1: Match by exact column title (for custom statuses)
        columnTasks = tasksByStatus[column.title] || []
        
        // Strategy 2: Match by column ID (for default numeric statuses)
        if (columnTasks.length === 0) {
          columnTasks = tasksByStatus[String(column.id)] || []
        }
        
        // Strategy 3: For default columns, also check common variations
        if (columnTasks.length === 0) {
          if (column.title === 'To Do' || column.title === 'Todo') {
            columnTasks = tasksByStatus['1'] || tasksByStatus['To Do'] || tasksByStatus['Todo'] || tasksByStatus['Backlog'] || []
          } else if (column.title === 'In Progress') {
            columnTasks = tasksByStatus['2'] || tasksByStatus['In Progress'] || tasksByStatus['In Development'] || []
          } else if (column.title === 'Done') {
            columnTasks = tasksByStatus['3'] || tasksByStatus['Done'] || tasksByStatus['Completed'] || []
          }
        }

        console.log(`📋 Column "${column.title}" (ID: ${column.id}):`, {
          tasksFound: columnTasks.length,
          taskTitles: columnTasks.map(t => t.title).slice(0, 2)
        })

        const Icon = column.icon

        return (
          <div 
            key={column.id} 
            className="flex-shrink-0 w-80"
          >
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="cursor-grab active:cursor-grabbing"
                      draggable
                      onDragStart={(e) => handleColumnDragStart(e, column.id)}
                      onDragOver={handleColumnDragOver}
                      onDrop={(e) => handleColumnDrop(e, column.id)}
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div 
                      className="p-1.5 rounded-md"
                      style={{ 
                        backgroundColor: column.color ? `${column.color}20` : '#6B728020' 
                      }}
                    >
                      <Icon className="h-4 w-4" style={{ color: column.color || '#6B7280' }} />
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
                    onClick={() => onCreateTask?.(String(column.id))}
                    className="h-6 w-6 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent 
                className="space-y-3 min-h-96"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id, column.title)}
              >
                {columnTasks.map((task) => {
                  const isOverdue = task.timelineEnd && new Date(task.timelineEnd) < new Date() && task.status !== 3 && task.status !== "done"
                  const isDueSoon = task.timelineEnd && 
                    new Date(task.timelineEnd) <= new Date(Date.now() + 24 * 60 + 60 * 1000) && 
                    task.status !== 3 && task.status !== "done"

                  return (
                    <Card
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className={cn(
                        "cursor-move transition-all duration-200 hover:shadow-md group",
                        isOverdue && "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20",
                        isDueSoon && !isOverdue && "border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20"
                      )}
                    >
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-2 flex-1">
                              <GripVertical className="h-3 w-3 text-muted-foreground mt-0.5" />
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
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onTaskEdit?.(task)}>
                                  <Edit className="mr-2 h-3 w-3" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => onTaskDelete?.(task.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-3 w-3" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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

                          {/* Progress Bar */}
                          {task.estimatedHours && task.estimatedHours > 0 && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Progress</span>
                                <span>{Math.round((task.loggedHours / task.estimatedHours) * 100)}%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-1">
                                <div 
                                  className="bg-primary h-1 rounded-full transition-all duration-300"
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
                })}
              </CardContent>
            </Card>
          </div>
        )
      })}
    </div>
  )
}