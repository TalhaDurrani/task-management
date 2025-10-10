"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, Plus, X, Upload, User, Tag as TagIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Form schema with all required features
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.string().min(1, "Type is required"),
  customType: z.string().optional(),
  projectId: z.string().min(1, "Project is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  status: z.string().min(1, "Status is required"),
  customStatus: z.string().optional(),
  dueDate: z.date().optional(),
  assignees: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  subTasks: z.array(
    z.object({
      title: z.string().min(1, "Subtask title is required"),
      description: z.string().optional(),
      userId: z.string().optional(),
      completed: z.boolean().optional(),
    })
  ).optional(),
  attachments: z.array(
    z.object({
      name: z.string(),
      url: z.string(),
      type: z.string(),
      size: z.number(),
    })
  ).optional(),
})

type FormData = z.infer<typeof formSchema>

interface Project {
  id: string
  title: string
}

interface User {
  id: string
  name: string
  email: string
}

interface TaskType {
  name: string
  color?: string
}

interface TaskStatus {
  name: string
  color?: string
  category?: string
}

interface Tag {
  id: string
  name: string
  color?: string | null
}

interface CreateTaskDialogProps {
  children?: React.ReactNode
  projectId?: string
  onTaskCreated?: () => void
  workflowStatuses?: Array<{
    id: string
    title: string
    color: string
    icon: any
  }>
}

export function CreateTaskDialog({ children, projectId, onTaskCreated, workflowStatuses }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [types, setTypes] = useState<TaskType[]>([])
  const [statuses, setStatuses] = useState<TaskStatus[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [assigneeOpen, setAssigneeOpen] = useState(false)
  const [tagOpen, setTagOpen] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "",
      projectId: projectId || "",
      priority: "MEDIUM" as const,
      status: "",
      dueDate: undefined,
      assignees: [],
      tags: [],
      subTasks: [],
      attachments: [],
    },
  })

  const { fields: subTaskFields, append: appendSubTask, remove: removeSubTask } = useFieldArray({
    control: form.control,
    name: "subTasks"
  })

  // Load all data when dialog opens
  useEffect(() => {
    if (open) {
      loadProjects()
      loadUsers()
      loadTypesAndStatuses()
      loadTags()
    }
  }, [open])

  useEffect(() => {
    if (projectId) {
      form.setValue("projectId", projectId)
    }
  }, [projectId, form])

  const loadProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(Array.isArray(data) ? data : (data.projects || []))
      }
    } catch (error) {
      console.error("Failed to load projects:", error)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/users/assignable")
      if (response.ok) {
        const data = await response.json()
        setUsers(Array.isArray(data) ? data : (data.users || []))
      }
    } catch (error) {
      console.error("Failed to load users:", error)
    }
  }

  const loadTypesAndStatuses = async () => {
    try {
      // Get current user to fetch workspace
      const userResponse = await fetch("/api/auth/me")
      let workspaceId = null
      if (userResponse.ok) {
        const userData = await userResponse.json()
        workspaceId = userData.workspaceId
      }

      // Load types
      const typesUrl = workspaceId ? `/api/tasks/type?workspaceId=${workspaceId}` : "/api/tasks/type"
      const typesResponse = await fetch(typesUrl)
      if (typesResponse.ok) {
        const typesData = await typesResponse.json()
        const allTypes = [...(typesData.default || []), ...(typesData.custom || [])]
        setTypes(allTypes)
      }

      // Use workflow statuses if provided, otherwise load from API
      if (workflowStatuses && workflowStatuses.length > 0) {
        // Convert workflow columns to status format
        const workflowStatusOptions = workflowStatuses.map(col => ({
          name: col.title,
          color: col.color
        }))
        setStatuses(workflowStatusOptions)
      } else {
        // Load statuses from API
        const statusesUrl = workspaceId ? `/api/tasks/status?workspaceId=${workspaceId}` : "/api/tasks/status"
        const statusesResponse = await fetch(statusesUrl)
        if (statusesResponse.ok) {
          const statusesData = await statusesResponse.json()
          setStatuses(statusesData)
        }
      }
    } catch (error) {
      console.error("Failed to load types and statuses:", error)
    }
  }

  const loadTags = async () => {
    try {
      // Get current user to fetch workspace
      const userResponse = await fetch("/api/auth/me")
      let workspaceId = null
      if (userResponse.ok) {
        const userData = await userResponse.json()
        workspaceId = userData.workspaceId
      }

      if (workspaceId) {
        const response = await fetch(`/api/tags?workspaceId=${workspaceId}`)
        if (response.ok) {
          const data = await response.json()
          setTags(Array.isArray(data) ? data : [])
        }
      }
    } catch (error) {
      console.error("Failed to load tags:", error)
    }
  }

  const createCustomType = async (typeName: string) => {
    try {
      const response = await fetch("/api/tasks/type", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: typeName })
      })

      if (response.ok) {
        const newType = await response.json()
        setTypes(prev => [...prev, newType])
        form.setValue('type', newType.name)
        
        // Notify parent component that custom fields were updated
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('customFieldsUpdated', { 
            detail: { type: 'type', action: 'create', data: newType } 
          }))
        }
        
        return true
      }
    } catch (error) {
      console.error("Failed to create custom type:", error)
    }
    return false
  }

  const createCustomStatus = async (statusName: string, category: string = 'BACKLOG') => {
    try {
      const response = await fetch("/api/tasks/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          name: statusName,
          category: category
        })
      })

      if (response.ok) {
        const newStatus = await response.json()
        console.log("Created custom status:", newStatus)
        console.log("Current statuses before update:", statuses)
        
        setStatuses(prev => {
          const updated = [...prev, newStatus]
          console.log("Updated statuses array:", updated)
          return updated
        })
        
        form.setValue('status', newStatus.name)
        console.log("Set form value to:", newStatus.name)
        
        // Notify parent component that custom fields were updated
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('customFieldsUpdated', { 
            detail: { type: 'status', action: 'create', data: newStatus } 
          }))
        }
        
        return true
      }
    } catch (error) {
      console.error("Failed to create custom status:", error)
    }
    return false
  }

  const handleFileUpload = (files: FileList) => {
    const fileArray = Array.from(files).map(file => ({
      fileName: file.name,
      filePath: URL.createObjectURL(file),
      fileSize: file.size,
      mimeType: file.type,
    }))
    
    const currentAttachments = form.getValues("attachments") || []
    form.setValue("attachments", [...currentAttachments, ...fileArray])
  }

  const removeAttachment = (index: number) => {
    const currentAttachments = form.getValues("attachments") || []
    const newAttachments = currentAttachments.filter((_, i) => i !== index)
    form.setValue("attachments", newAttachments)
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      // Handle custom type creation if needed
      if (data.type === 'CUSTOM' && data.customType) {
        const created = await createCustomType(data.customType)
        if (!created) {
          alert('Failed to create custom type')
          setIsLoading(false)
          return
        }
        data.type = data.customType
      }

      // Handle custom status creation if needed
      if (data.status === 'CUSTOM' && data.customStatus) {
        const created = await createCustomStatus(data.customStatus)
        if (!created) {
          alert('Failed to create custom status')
          setIsLoading(false)
          return
        }
        // For custom status, set numeric status and customStatus
        data.status = 1 // Default to Todo for new custom statuses
        // data.customStatus is already set to the custom status name
      } else {
        // Handle status conversion for numeric system
        // If workflow statuses are provided, convert selected status to numeric value
        if (workflowStatuses && workflowStatuses.length > 0) {
          // Find the selected workflow status and convert to numeric
          const selectedWorkflowStatus = workflowStatuses.find(ws => ws.title === data.status)
          if (selectedWorkflowStatus) {
            // Convert workflow status title to numeric value
            if (selectedWorkflowStatus.title === 'Todo' || selectedWorkflowStatus.title.toLowerCase().includes('todo')) {
              data.status = 1
            } else if (selectedWorkflowStatus.title === 'In Progress' || selectedWorkflowStatus.title.toLowerCase().includes('progress')) {
              data.status = 2
            } else if (selectedWorkflowStatus.title === 'Done' || selectedWorkflowStatus.title.toLowerCase().includes('done')) {
              data.status = 3
            } else {
              data.status = 1 // Default to Todo
            }
            data.customStatus = selectedWorkflowStatus.title
          }
        } else {
          // Handle default status conversion for backward compatibility
          const selectedStatus = statuses.find(s => s.name === data.status)
          if (selectedStatus) {
            // Convert status name to numeric value
            if (selectedStatus.name === 'Todo') {
              data.status = 1
            } else if (selectedStatus.name === 'In Progress') {
              data.status = 2
            } else if (selectedStatus.name === 'Done') {
              data.status = 3
            } else {
              data.status = 1 // Default to Todo
            }
          } else {
            // Default fallback
            data.status = 1
          }
        }
      }

      console.log('Final task data being sent:', data)

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setOpen(false)
        form.reset()
        onTaskCreated?.()
      } else {
        const error = await response.json()
        console.error("Failed to create task:", error)
        alert(error.message || "Failed to create task")
      }
    } catch (error) {
      console.error("Error creating task:", error)
      alert("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
          <DialogDescription>
            Add a new task to your project with custom types, statuses, subtasks, and attachments.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Task title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Task description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Project and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Type and Status */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Type</FormLabel>
                    <div className="space-y-2">
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value)
                          if (value !== 'CUSTOM') {
                            form.setValue('customType', undefined)
                          }
                        }} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {types.map((type) => (
                            <SelectItem key={type.name} value={type.name}>
                              {type.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="CUSTOM">
                            <div className="flex items-center">
                              <Plus className="h-4 w-4 mr-2" />
                              Create Custom Type
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {field.value === 'CUSTOM' && (
                        <div className="space-y-2">
                          <FormField
                            control={form.control}
                            name="customType"
                            render={({ field: customTypeField }) => (
                              <FormItem>
                                <FormControl>
                                  <Input 
                                    placeholder="Enter custom type name" 
                                    {...customTypeField}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const customTypeName = form.getValues('customType')
                              if (customTypeName && customTypeName.trim()) {
                                const success = await createCustomType(customTypeName.trim())
                                if (success) {
                                  form.setValue('customType', '')
                                }
                              }
                            }}
                          >
                            Save Custom Type
                          </Button>
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <div className="space-y-2">
                      <Select 
                        key={`status-select-${statuses.length}`}
                        onValueChange={(value) => {
                          field.onChange(value)
                          if (value !== 'CUSTOM') {
                            form.setValue('customStatus', undefined)
                          }
                        }} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statuses.map((status) => (
                            <SelectItem key={status.name} value={status.name}>
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: status.color || '#gray' }}
                                ></div>
                                <span>{status.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                          <SelectItem value="CUSTOM">
                            <div className="flex items-center">
                              <Plus className="h-4 w-4 mr-2" />
                              Create Custom Status
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {field.value === 'CUSTOM' && (
                        <div className="space-y-2">
                          <FormField
                            control={form.control}
                            name="customStatus"
                            render={({ field: customStatusField }) => (
                              <FormItem>
                                <FormControl>
                                  <Input 
                                    placeholder="Enter custom status name" 
                                    {...customStatusField}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const customStatusName = form.getValues('customStatus')
                              if (customStatusName && customStatusName.trim()) {
                                const success = await createCustomStatus(customStatusName.trim())
                                if (success) {
                                  form.setValue('customStatus', '')
                                }
                              }
                            }}
                          >
                            Save Custom Status
                          </Button>
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Due Date */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <Popover open={dateOpen} onOpenChange={setDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        onClick={() => setDateOpen(!dateOpen)}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date)
                          setDateOpen(false)
                        }}
                        disabled={(date) => date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Assignees */}
            <FormField
              control={form.control}
              name="assignees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignees</FormLabel>
                  <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !field.value?.length && "text-muted-foreground"
                        )}
                        onClick={() => setAssigneeOpen(!assigneeOpen)}
                      >
                        {field.value?.length ? (
                          <div className="flex flex-wrap gap-1">
                            {field.value.map((userId) => {
                              const user = users.find(u => u.id === userId)
                              return user ? (
                                <Badge key={userId} variant="secondary" className="text-xs">
                                  {user.name}
                                </Badge>
                              ) : null
                            })}
                          </div>
                        ) : (
                          "Select assignees..."
                        )}
                        <User className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search users..." />
                        <CommandEmpty>No users found.</CommandEmpty>
                        <CommandGroup>
                          {users.map((user) => (
                            <CommandItem
                              key={user.id}
                              value={user.id}
                              onSelect={() => {
                                const currentAssignees = field.value || []
                                const isSelected = currentAssignees.includes(user.id)
                                if (isSelected) {
                                  field.onChange(currentAssignees.filter(id => id !== user.id))
                                } else {
                                  field.onChange([...currentAssignees, user.id])
                                }
                              }}
                            >
                              <Checkbox
                                checked={field.value?.includes(user.id) || false}
                                className="mr-2"
                              />
                              {user.name} ({user.email})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <Popover open={tagOpen} onOpenChange={setTagOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !field.value?.length && "text-muted-foreground"
                        )}
                        onClick={() => setTagOpen(!tagOpen)}
                      >
                        {field.value?.length ? (
                          <div className="flex flex-wrap gap-1">
                            {field.value.map((tagId) => {
                              const tag = tags.find(t => t.id === tagId)
                              return tag ? (
                                <Badge key={tagId} variant="secondary" className="text-xs flex items-center gap-1">
                                  <div 
                                    className="w-2 h-2 rounded-full" 
                                    style={{ backgroundColor: tag.color || '#gray' }}
                                  />
                                  {tag.name}
                                </Badge>
                              ) : null
                            })}
                          </div>
                        ) : (
                          "Select tags..."
                        )}
                        <TagIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search tags..." />
                        <CommandEmpty>No tags found.</CommandEmpty>
                        <CommandGroup>
                          {tags.map((tag) => (
                            <CommandItem
                              key={tag.id}
                              value={tag.id}
                              onSelect={() => {
                                const currentTags = field.value || []
                                const isSelected = currentTags.includes(tag.id)
                                if (isSelected) {
                                  field.onChange(currentTags.filter(id => id !== tag.id))
                                } else {
                                  field.onChange([...currentTags, tag.id])
                                }
                              }}
                            >
                              <Checkbox
                                checked={field.value?.includes(tag.id) || false}
                                className="mr-2"
                              />
                              <div 
                                className="w-2 h-2 rounded-full mr-2" 
                                style={{ backgroundColor: tag.color || '#gray' }}
                              />
                              {tag.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Subtasks Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Subtasks</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendSubTask({ title: "" })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Subtask
                </Button>
              </div>
              
              {subTaskFields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start p-4 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <FormField
                      control={form.control}
                      name={`subTasks.${index}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Subtask title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`subTasks.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea placeholder="Subtask description (optional)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`subTasks.${index}.userId`}
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Assign to (optional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeSubTask(index)}
                    className="mt-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* File Attachments Section */}
            <div className="space-y-4">
              <FormLabel>Attachments</FormLabel>
              
              {/* File Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="space-y-2">
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-sm font-medium text-gray-900">
                      Drop files here or click to upload
                    </span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          handleFileUpload(e.target.files)
                        }
                      }}
                    />
                  </Label>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, PDF, DOC up to 10MB each
                  </p>
                </div>
              </div>

              {/* Uploaded Files List */}
              {form.watch("attachments") && form.watch("attachments")!.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Uploaded Files:</p>
                  {form.watch("attachments")!.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{attachment.fileName}</p>
                        <p className="text-xs text-gray-500">
                          {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
