"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { TaskWithSubtasks, TaskStatus } from "@/types"

const formSchema = z.object({
  title: z.string().min(1, "Task title is required").max(200, "Task title is too long"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  projectId: z.string().min(1, "Project is required"),
  assigneeId: z.string().optional(),
  startDate: z.date().optional(),
  dueDate: z.date().optional(),
  estimatedHours: z.number().min(0).optional(),
  storyPoints: z.number().min(0).optional(),
  issueType: z.enum(["story", "bug", "task", "epic"]).optional(),
  status: z.object({
    id: z.string(),
    name: z.string(),
    color: z.string(),
    category: z.enum(["not-started", "in-progress", "completed"]),
    order: z.number()
  }).optional(),
  subtasks: z.array(z.object({
    title: z.string().min(1, "Subtask title is required"),
    description: z.string().optional()
  })).optional()
})

type FormData = z.infer<typeof formSchema>

interface CreateTaskDialogProps {
  children?: React.ReactNode
  projectId?: string
  onTaskCreated?: () => void
}

export function CreateTaskDialog({ children, projectId, onTaskCreated }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [newLabel, setNewLabel] = useState("")
  const [subtasks, setSubtasks] = useState<{title: string, description?: string}[]>([])
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>({
    id: "1",
    name: "To Do",
    color: "#6B7280",
    category: "not-started",
    order: 1
  })

  // Load dynamic data when dialog opens
  useEffect(() => {
    if (open) {
      const loadData = async () => {
        try {
          // Load projects
          const projectsResponse = await fetch('/api/projects')
          if (projectsResponse.ok) {
            const projectsData = await projectsResponse.json()
            setProjects(projectsData)
          }
          
          // Load users
          const usersResponse = await fetch('/api/users')
          if (usersResponse.ok) {
            const usersData = await usersResponse.json()
            setUsers(usersData)
          }
        } catch (error) {
          console.error('Error loading data for task creation:', error)
        }
      }
      
      loadData()
    }
  }, [open])

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      projectId: projectId || "",
      assigneeId: "unassigned",
      startDate: undefined,
      dueDate: undefined,
      estimatedHours: 0,
      storyPoints: undefined,
      issueType: "task",
      status: selectedStatus,
      subtasks: []
    },
  })

  const onSubmit = async (data: FormData) => {
    try {
      const taskData = {
        title: data.title,
        description: data.description || null,
        projectId: data.projectId,
        assignedTo: data.assigneeId === "unassigned" ? null : data.assigneeId,
        status: "PENDING", // Use the correct enum value
        label: selectedLabels.join(", ") || null,
        dueDate: data.dueDate ? data.dueDate.toISOString() : null,
        endDate: data.startDate ? data.startDate.toISOString() : null,
        attachments: null
      }
      
      console.log("Creating task:", taskData)
      
      // Make actual API call
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create task')
      }
      
      const createdTask = await response.json()
      console.log("Task created successfully:", createdTask)
      
      // Reset form
      form.reset()
      setSelectedLabels([])
      setSubtasks([])
      setSelectedStatus({
        id: "1",
        name: "To Do",
        color: "#6B7280",
        category: "not-started",
        order: 1
      })
      setOpen(false)
      
      onTaskCreated?.()
      
      alert("Task created successfully!")
    } catch (error) {
      console.error("Error creating task:", error)
      alert(`Failed to create task: ${error.message}`)
    }
  }

  const addLabel = () => {
    if (newLabel.trim() && !selectedLabels.includes(newLabel.trim())) {
      setSelectedLabels([...selectedLabels, newLabel.trim()])
      setNewLabel("")
    }
  }

  const removeLabel = (label: string) => {
    setSelectedLabels(selectedLabels.filter(l => l !== label))
  }

  const addSubtask = () => {
    const newSubtask = { 
      title: "", 
      description: "" 
    }
    setSubtasks([...subtasks, newSubtask])
  }

  const removeSubtask = (index: number) => {
    const updatedSubtasks = [...subtasks]
    updatedSubtasks.splice(index, 1)
    setSubtasks(updatedSubtasks)
  }

  const commonLabels = ["bug", "feature", "urgent", "review", "design", "backend", "frontend"]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to your project. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              placeholder="Enter task title..."
              {...form.register("title")}
              className={cn(form.formState.errors.title && "border-destructive")}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the task..."
              rows={3}
              {...form.register("description")}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Project */}
            <div className="space-y-2">
              <Label htmlFor="project">Project *</Label>
              <Select
                value={form.watch("projectId")}
                onValueChange={(value) => form.setValue("projectId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title || project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.projectId && (
                <p className="text-sm text-destructive">{form.formState.errors.projectId.message}</p>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={form.watch("priority")}
                onValueChange={(value: "low" | "medium" | "high" | "critical") => 
                  form.setValue("priority", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Assignee */}
            <div className="space-y-2">
              <Label htmlFor="assignee">Assignee</Label>
              <Select
                value={form.watch("assigneeId")}
                onValueChange={(value) => form.setValue("assigneeId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estimated Hours */}
            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Estimated Hours</Label>
              <Input
                id="estimatedHours"
                type="number"
                min="0"
                step="0.5"
                placeholder="0"
                {...form.register("estimatedHours", { valueAsNumber: true })}
              />
            </div>

            {/* Story Points */}
            <div className="space-y-2">
              <Label htmlFor="storyPoints">Story Points</Label>
              <Input
                id="storyPoints"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                {...form.register("storyPoints", { valueAsNumber: true })}
              />
            </div>

            {/* Issue Type */}
            <div className="space-y-2">
              <Label htmlFor="issueType">Issue Type</Label>
              <Select
                value={form.watch("issueType")}
                onValueChange={(value) => form.setValue("issueType", value as "story" | "bug" | "task" | "epic")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="story">📖 Story</SelectItem>
                  <SelectItem value="bug">🐛 Bug</SelectItem>
                  <SelectItem value="task">📋 Task</SelectItem>
                  <SelectItem value="epic">🎯 Epic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !form.watch("startDate") && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch("startDate") ? (
                    format(form.watch("startDate")!, "PPP")
                  ) : (
                    <span>Pick start date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.watch("startDate")}
                  onSelect={(date) => form.setValue("startDate", date)}
                  initialFocus
                />
                {form.watch("startDate") && (
                  <div className="p-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => form.setValue("startDate", undefined)}
                    >
                      Clear Start Date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !form.watch("dueDate") && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch("dueDate") ? (
                    format(form.watch("dueDate")!, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.watch("dueDate")}
                  onSelect={(date) => form.setValue("dueDate", date)}
                  initialFocus
                />
                {form.watch("dueDate") && (
                  <div className="p-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => form.setValue("dueDate", undefined)}
                    >
                      Clear Date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* Labels */}
          <div className="space-y-2">
            <Label>Labels</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedLabels.map((label) => (
                <Badge key={label} variant="secondary" className="flex items-center gap-1">
                  {label}
                  <button
                    type="button"
                    onClick={() => removeLabel(label)}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="Add label..."
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addLabel())}
              />
              <Button type="button" variant="outline" onClick={addLabel}>
                Add
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-1">
              {commonLabels
                .filter(label => !selectedLabels.includes(label))
                .map((label) => (
                  <Button
                    key={label}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedLabels([...selectedLabels, label])}
                    className="h-6 px-2 text-xs"
                  >
                    {label}
                  </Button>
                ))}
            </div>
          </div>

          {/* Status Selection with Color */}
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "1", name: "To Do", color: "#6B7280", category: "not-started", order: 1 },
                { id: "2", name: "In Progress", color: "#3B82F6", category: "in-progress", order: 2 },
                { id: "3", name: "Done", color: "#10B981", category: "completed", order: 3 }
              ].map((status) => (
                <Button
                  key={status.id}
                  type="button"
                  variant={selectedStatus.id === status.id ? "default" : "outline"}
                  style={{ 
                    backgroundColor: selectedStatus.id === status.id ? status.color : 'transparent',
                    color: selectedStatus.id === status.id ? 'white' : status.color
                  }}
                  onClick={() => setSelectedStatus(status)}
                >
                  {status.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Subtasks Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Subtasks</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addSubtask}
              >
                Add Subtask
              </Button>
            </div>
            
            {subtasks.map((subtask, index) => (
              <div key={index} className="flex space-x-2">
                <Input
                  placeholder="Subtask title"
                  value={subtask.title}
                  onChange={(e) => {
                    const updatedSubtasks = [...subtasks]
                    updatedSubtasks[index].title = e.target.value
                    setSubtasks(updatedSubtasks)
                  }}
                />
                <Input
                  placeholder="Description (optional)"
                  value={subtask.description}
                  onChange={(e) => {
                    const updatedSubtasks = [...subtasks]
                    updatedSubtasks[index].description = e.target.value
                    setSubtasks(updatedSubtasks)
                  }}
                />
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="icon"
                  onClick={() => removeSubtask(index)}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}