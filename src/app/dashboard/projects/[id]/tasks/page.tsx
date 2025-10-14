"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWorkspace } from "@/components/providers/workspace-provider"
import { KanbanBoard } from "@/components/tasks/kanban-board"
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog"
import { TasksListView } from "@/components/tasks/tasks-list-view"
import { TimerWidget } from "@/components/timer/timer-widget"
import { TimeLogsList } from "@/components/timer/time-logs-list"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, ArrowLeft, Clock, List, Table, Circle, AlertCircle, CheckCircle2, Star, Zap, Target, Flag, Columns, X } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export const dynamic = 'force-dynamic'
interface TasksPageProps {
  params: {
    id: string
  }
}
export const mapStatusToUI = (apiStatus: string | number) => {
  // If it's already a number, convert to string format for UI
  if (typeof apiStatus === 'number') {
    switch (apiStatus) {
      case 1: return 'todo'
      case 2: return 'in-progress'
      case 3: return 'done'
      default: return 'todo'
    }
  }

  // Handle string status from API
  switch (apiStatus) {
    case 'TODO': return 'todo'
    case 'PENDING': return 'todo'
    case 'DONE': return 'done'
    case 'CANCELLED': return 'todo' // Map cancelled to todo for now
    default: return 'todo'
  }
}

// Icon mapping for database storage and retrieval
const iconMap: Record<string, any> = {
  'Circle': Circle,
  'AlertCircle': AlertCircle,
  'CheckCircle2': CheckCircle2,
  'Star': Star,
  'Zap': Zap,
  'Target': Target,
  'Flag': Flag
}

const getIconFromName = (iconName: string) => {
  return iconMap[iconName] || Circle // Default to Circle if not found
}

const getIconName = (iconComponent: any) => {
  // Find the key for the icon component
  for (const [name, component] of Object.entries(iconMap)) {
    if (component === iconComponent) {
      return name
    }
  }
  return 'Circle' // Default
}

export default function TasksPage({ params }: TasksPageProps) {
  const { selectedWorkspace } = useWorkspace()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [project, setProject] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [customStatuses, setCustomStatuses] = useState<any[]>([])
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false)
  const [customWorkflowColumns, setCustomWorkflowColumns] = useState<any[]>([])
  const [savedWorkflows, setSavedWorkflows] = useState<any[]>([])
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null)
  const [workflowManagerOpen, setWorkflowManagerOpen] = useState(false)
  const router = useRouter()

  // Transform API task data to UI format
  const transformTaskData = (apiTasks: any[]) => {
    return apiTasks.map(task => ({
      id: task.id,
      title: task.title || 'Untitled Task',
      description: task.description,
      type: task.type,
      status: task.status, // Keep numeric status (1/2/3) for proper column matching
      customStatus: task.customStatus, // Include custom status
      statusCategory: task.statusCategory, // Include status category
      priority: task.priority || 'not setted', // Default priority since it's not in the API
      labels: task.label ? task.label.split(',').map((l: string) => l.trim()) : [],
      projectId: task.projectId,
      project: {
        id: task.project?.id || task.projectId,
        name: task.project?.title || 'Unknown Project'
      },
      assignees: task.assignees ? task.assignees.map((assignee: any) => ({
        id: assignee.id,
        name: assignee.name,
        email: assignee.email,
        avatar: undefined
      })) : [],
      assignee: task.assignees && task.assignees.length === 1 ? {
        id: task.assignees[0].id,
        name: task.assignees[0].name,
        email: task.assignees[0].email,
        avatar: undefined
      } : null, // Only set for single assignee (backward compatibility)
      timelineStart: task.endDate ? new Date(task.endDate) : null,
      timelineEnd: task.dueDate ? new Date(task.dueDate) : null,
      estimatedHours: null,
      loggedHours: 0,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.createdAt)
    }))
  }

  // Map API status to UI status


  useEffect(() => {
    const loadData = async () => {
      // Guard: Don't load if no workspace is selected
      if (!selectedWorkspace) {
        setIsLoading(false)
        return
      }

      try {
        // Get current user from the new auth system
        const response = await fetch('/api/auth/login', {
          method: 'GET'
        })
        
        const result = await response.json()
        
        if (result.success && result.user) {
          setCurrentUser(result.user)
          
          // Load project data from API
          const projectResponse = await fetch(`/api/projects/${params.id}`)
          if (projectResponse.ok) {
            const projectData = await projectResponse.json()
            
            // Workspace validation: Ensure project belongs to selected workspace
            if (projectData.workspaceId !== selectedWorkspace.id) {
              toast.error('This project does not belong to the selected workspace')
              router.push('/dashboard/projects')
              return
            }
            
            setProject(projectData)
          } else {
            toast.error('Failed to load project')
            router.push('/dashboard/projects')
            return
          }
          
          // Load tasks data from API
          const tasksResponse = await fetch(`/api/tasks?projectId=${params.id}`)
          if (tasksResponse.ok) {
            const tasksData = await tasksResponse.json()
            
            // Transform the data for UI components
            const transformedTasks = transformTaskData(tasksData)
            setTasks(transformedTasks)
          }

          // Load workflows for this project
          const workflowsResponse = await fetch(`/api/workflows?projectId=${params.id}`)
          if (workflowsResponse.ok) {
            const workflowsData = await workflowsResponse.json()
            console.log('📁 Loaded workflows:', workflowsData.length)
            setSavedWorkflows(workflowsData)
            
            // Auto-select the default workflow or first workflow
            const defaultWorkflow = workflowsData.find((w: any) => w.isDefault) || workflowsData[0]
            if (defaultWorkflow) {
              console.log('✅ Auto-loading default workflow:', defaultWorkflow.name)
              loadWorkflow(defaultWorkflow)
            }
          }

          // Load custom statuses for the SELECTED workspace (not primary workspace)
          if (selectedWorkspace.id) {
            const statusesResponse = await fetch(`/api/custom-statuses?workspaceId=${selectedWorkspace.id}`)
            if (statusesResponse.ok) {
              const statusesData = await statusesResponse.json()
              setCustomStatuses(statusesData)
            }
          }
        } else {
          // Redirect to sign-in if not authenticated
          window.location.href = "/auth/signin"
        }
      } catch (error) {
        console.error('Error loading tasks data:', error)
        // Only redirect on authentication errors, not general errors
        if (error instanceof Error && error.message.includes('auth')) {
          window.location.href = "/auth/signin"
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [params.id, selectedWorkspace?.id, router])

  const handleTaskCreated = async () => {
    // Reload tasks data
    try {
      const tasksResponse = await fetch(`/api/tasks?projectId=${params.id}`)
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json()

        // Transform the data for UI components
        const transformedTasks = transformTaskData(tasksData)
        setTasks(transformedTasks)
      }
    } catch (error) {
      console.error('Failed to refresh tasks:', error)
    }
  }

  const handleTaskStatusUpdate = async (taskId: string, newStatus: string | number) => {
    try {
      console.log('🔄 handleTaskStatusUpdate called:', { taskId: taskId.slice(0, 8), newStatus })
      
      // Handle both column IDs (numeric or UUID) and string statuses
      let apiStatus: number = 1 // Default to BACKLOG
      let customStatusToSend: string | undefined = undefined

      // Get columns from either customWorkflowColumns or the selected workflow
      const selectedWorkflow = savedWorkflows.find(w => w.id === currentWorkflowId)
      const workflowColumns = customWorkflowColumns.length > 0 
        ? customWorkflowColumns 
        : (selectedWorkflow?.columns || [])

      console.log('📋 Available columns:', workflowColumns.map((c: any) => ({ id: c.id, title: c.title })))

      // First, check if newStatus matches a column ID or title in workflow columns
      const matchedColumn = workflowColumns.find((col: any) => 
        String(col.id) === String(newStatus) || col.title === newStatus
      )

      console.log('🎯 Matched column:', matchedColumn ? { id: matchedColumn.id, title: matchedColumn.title, category: matchedColumn.category } : 'NONE')

      if (matchedColumn) {
        // Found a matching column
        customStatusToSend = matchedColumn.title
        
        // Map to numeric status based on column title or stored category
        if (matchedColumn.title === 'Todo' || matchedColumn.title === 'Backlog') {
          apiStatus = 1
        } else if (matchedColumn.title === 'In Progress' || matchedColumn.title === 'In Development') {
          apiStatus = 2
        } else if (matchedColumn.title === 'Done' || matchedColumn.title === 'Completed') {
          apiStatus = 3
        } else {
          // For custom columns, use stored category or look it up
          const category = (matchedColumn as any).category || 
            customStatuses.find(s => s.name === matchedColumn.title || s.id === matchedColumn.id)?.category
          
          if (category) {
            // Map category to numeric status
            switch (category) {
              case 'BACKLOG':
                apiStatus = 1
                break
              case 'IN_PROGRESS':
                apiStatus = 2
                break
              case 'COMPLETED':
                apiStatus = 3
                break
              case 'ON_HOLD':
                apiStatus = 1 // Treat ON_HOLD as BACKLOG
                break
              default:
                apiStatus = 1
            }
          } else {
            // Default to 1 if we can't find the category
            apiStatus = 1
          }
        }
      } 
      // Handle numeric status values (1, 2, 3)
      else if (typeof newStatus === 'number' || (typeof newStatus === 'string' && /^\d+$/.test(newStatus))) {
        apiStatus = typeof newStatus === 'number' ? newStatus : parseInt(newStatus, 10)
        
        // Get the column title for this numeric status
        const col = customWorkflowColumns.find(c => c.id === apiStatus)
        if (col && !['Todo', 'In Progress', 'Done'].includes(col.title)) {
          customStatusToSend = col.title
        }
      }
      // Handle string status names
      else if (typeof newStatus === 'string') {
        const normalized = newStatus.toLowerCase()
        if (normalized === 'todo' || normalized === 'backlog') {
          apiStatus = 1
        } else if (normalized === 'in-progress' || normalized === 'in_progress' || normalized === 'in progress') {
          apiStatus = 2
        } else if (normalized === 'done' || normalized === 'completed') {
          apiStatus = 3
        } else {
          // Treat as custom status name
          customStatusToSend = newStatus
          apiStatus = 1
        }
      }

      // Build payload
      const payload: any = { status: apiStatus }
      if (customStatusToSend) {
        payload.customStatus = customStatusToSend
      }

      console.log('Updating task status:', { taskId, newStatus, payload })

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        // Refresh tasks to get updated state from server
        await handleTaskCreated()
      } else {
        const error = await response.json()
        console.error('Failed to update task status:', error)
      }
    } catch (error) {
      console.error('Error updating task status:', error)
    }
  }

  // Load saved workflows on mount
  useEffect(() => {
    if (currentUser) {
      loadSavedWorkflows()
      loadCustomStatuses()
    }
  }, [currentUser, params.id])

  const loadCustomStatuses = async () => {
    try {
      // Get current user to fetch workspace
      const userResponse = await fetch("/api/auth/me")
      let workspaceId = null
      if (userResponse.ok) {
        const userData = await userResponse.json()
        workspaceId = userData.workspaceId
      }

      if (workspaceId) {
        const response = await fetch(`/api/tasks/status?workspaceId=${workspaceId}`)
        if (response.ok) {
          const statuses = await response.json()
          // Filter out default statuses, keep only custom ones
          const customStatusesOnly = statuses.filter((status: any) => 
            !['TODO', 'IN_PROGRESS', 'DONE'].includes(status.name)
          )
          setCustomStatuses(customStatusesOnly)
        }
      }
    } catch (error) {
      console.error("Failed to load custom statuses:", error)
    }
  }

  const loadSavedWorkflows = async () => {
    try {
      const response = await fetch(`/api/workflows?projectId=${params.id}`)
      if (response.ok) {
        const workflows = await response.json()
        // Convert icon names to components for all workflows
        const workflowsWithIcons = workflows.map((workflow: any) => ({
          ...workflow,
          columns: workflow.columns.map((col: any) => ({
            ...col,
            icon: getIconFromName(col.icon)
          }))
        }))
        setSavedWorkflows(workflowsWithIcons)
        
        // Load default workflow if exists
        const defaultWorkflow = workflowsWithIcons.find((w: any) => w.isDefault)
        if (defaultWorkflow && !customWorkflowColumns.length) {
          setCustomWorkflowColumns(defaultWorkflow.columns)
          setCurrentWorkflowId(defaultWorkflow.id)
        }
        // If no workflows exist and no custom columns, initialize with default columns
        else if (workflowsWithIcons.length === 0 && !customWorkflowColumns.length) {
          const defaultColumns = [
            {
              id: 1,
              title: "Todo",
              color: "bg-gray-100 dark:bg-gray-800",
              icon: Circle,
              count: 0
            },
            {
              id: 2,
              title: "In Progress",
              color: "bg-yellow-100 dark:bg-yellow-900",
              icon: AlertCircle,
              count: 0
            },
            {
              id: 3,
              title: "Done",
              color: "bg-green-100 dark:bg-green-900",
              icon: CheckCircle2,
              count: 0
            }
          ]
          setCustomWorkflowColumns(defaultColumns)
        }
      }
    } catch (error) {
      console.error('Failed to load workflows:', error)
    }
  }

  const saveWorkflow = async (name: string, isDefault: boolean = false) => {
    try {
      // Convert icons to names before saving
      const columnsWithIconNames = customWorkflowColumns.map(col => ({
        ...col,
        icon: getIconName(col.icon)
      }))

      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: params.id,
          name,
          columns: columnsWithIconNames,
          isDefault
        })
      })
      
      if (response.ok) {
        const savedWorkflow = await response.json()
        // Convert icon names back to components for UI
        const workflowWithIcons = {
          ...savedWorkflow,
          columns: savedWorkflow.columns.map((col: any) => ({
            ...col,
            icon: getIconFromName(col.icon)
          }))
        }
        setSavedWorkflows(prev => [workflowWithIcons, ...prev])
        setCurrentWorkflowId(savedWorkflow.id)
        return workflowWithIcons
      }
    } catch (error) {
      console.error('Failed to save workflow:', error)
      throw error
    }
  }

  const updateWorkflow = async (workflowId: string, columns: any[]) => {
    try {
      // Convert icons to names before saving
      const columnsWithIconNames = columns.map(col => ({
        ...col,
        icon: getIconName(col.icon)
      }))

      await fetch(`/api/workflows/${workflowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columns: columnsWithIconNames })
      })
    } catch (error) {
      console.error('Failed to update workflow:', error)
    }
  }

  const loadWorkflow = (workflow: any) => {
    // Convert icon names back to components
    const columnsWithIcons = workflow.columns.map((col: any) => ({
      ...col,
      icon: getIconFromName(col.icon)
    }))
    setCustomWorkflowColumns(columnsWithIcons)
    setCurrentWorkflowId(workflow.id)
  }

  const handleWorkflowChange = (workflowId: string) => {
    const workflow = savedWorkflows.find(w => w.id === workflowId)
    if (workflow) {
      loadWorkflow(workflow)
    }
  }

  const addCustomWorkflowColumn = async (status: any) => {
    console.log('➕ Adding custom workflow column:', { 
      id: status.id, 
      name: status.name, 
      category: status.category 
    })
    
    // Use the CustomStatus UUID as the column ID for uniqueness
    // Map category to get the appropriate icon
    let icon = Circle
    if (status.category === 'IN_PROGRESS') {
      icon = AlertCircle
    } else if (status.category === 'COMPLETED') {
      icon = CheckCircle2
    } else if (status.category === 'ON_HOLD') {
      icon = Flag
    }
    
    // Create a column object for the custom status
    const newColumn = {
      id: status.id || Date.now().toString(), // Use CustomStatus UUID or timestamp
      title: status.name,
      color: status.color || '#6B7280', // Use hex color directly
      icon: icon,
      category: status.category, // Store category for status mapping
      count: 0
    }
    
    console.log('📦 New column object:', newColumn)

    let updatedColumns = [...customWorkflowColumns]

    // If this is the first custom column, include default columns with numeric IDs
    if (updatedColumns.length === 0) {
      updatedColumns = [
        {
          id: 1,
          title: "Todo",
          color: "#9CA3AF",
          icon: Circle,
          count: 0
        },
        {
          id: 2,
          title: "In Progress",
          color: "#F59E0B",
          icon: AlertCircle,
          count: 0
        },
        {
          id: 3,
          title: "Done",
          color: "#10B981",
          icon: CheckCircle2,
          count: 0
        }
      ]
    }

    // Check if column already exists by title or id
    const columnExists = updatedColumns.some(
      col => col.title === newColumn.title || col.id === newColumn.id
    )
    
    if (!columnExists) {
      updatedColumns.push(newColumn)
    } else {
      console.log('Column already exists:', newColumn.title)
      return // Don't save if already exists
    }

    setCustomWorkflowColumns(updatedColumns)

    // Auto-save the workflow
    try {
      if (currentWorkflowId) {
        // Update existing workflow
        await updateWorkflow(currentWorkflowId, updatedColumns)
        
        // IMPORTANT: Update the savedWorkflows state so kanban board sees the changes
        setSavedWorkflows(prev => prev.map(w => 
          w.id === currentWorkflowId 
            ? { 
                ...w, 
                columns: updatedColumns.map(col => ({
                  ...col,
                  icon: getIconName(col.icon) // Convert icon component to name for storage
                }))
              }
            : w
        ))
      } else {
        // Create a new temporary workflow and set it as default if none exists
        const tempWorkflow = await saveWorkflow(`Auto-saved Workflow - ${new Date().toLocaleDateString()}`, true)
        setCurrentWorkflowId(tempWorkflow.id)
      }
      
      console.log('✅ Workflow updated successfully with', updatedColumns.length, 'columns')
    } catch (error) {
      console.error('Failed to auto-save workflow:', error)
    }

    // Don't close the dialog - allow user to add more columns
    // setWorkflowDialogOpen(false)
  }

  const deleteCustomWorkflowColumn = async (columnId: string | number) => {
    console.log('🗑️ Deleting column:', columnId)
    
    // Remove the column from customWorkflowColumns
    const updatedColumns = customWorkflowColumns.filter(col => col.id !== columnId)
    
    console.log('📋 Remaining columns:', updatedColumns.length)
    setCustomWorkflowColumns(updatedColumns)

    // Auto-save the workflow
    try {
      if (currentWorkflowId) {
        // Update existing workflow
        await updateWorkflow(currentWorkflowId, updatedColumns)
        
        // Update the savedWorkflows state so kanban board sees the changes
        setSavedWorkflows(prev => prev.map(w => 
          w.id === currentWorkflowId 
            ? { 
                ...w, 
                columns: updatedColumns.map(col => ({
                  ...col,
                  icon: getIconName(col.icon)
                }))
              }
            : w
        ))
        
        console.log('✅ Column deleted and workflow updated')
      }
    } catch (error) {
      console.error('Failed to update workflow after deletion:', error)
    }
  }

  // Guard: Show message if no workspace is selected
  if (!selectedWorkspace) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Workspace Selected</h1>
          <p className="text-muted-foreground mb-4">Please select a workspace from the sidebar to view project tasks.</p>
          <Button onClick={() => router.push('/dashboard/projects')}>
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
          <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => router.push('/dashboard/projects')}>
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/projects/${params.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Project
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project.title} - Tasks</h1>
            <p className="text-muted-foreground">Manage tasks using Kanban board or list view</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mb-4">
          <Button onClick={() => setWorkflowDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Work Flow
          </Button>
          {/* <Button variant="outline" onClick={() => setWorkflowManagerOpen(true)}>
            <List className="mr-2 h-4 w-4" />
            Manage Workflows
          </Button> */}
        </div>
      </div>

      <Tabs defaultValue="kanban" className="space-y-4">
        <TabsList>
          <TabsTrigger value="kanban" className="flex items-center gap-2">
            Work Flow
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            List View
          </TabsTrigger>
          <TabsTrigger value="timer" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Time Tracking
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="kanban">
          <div className="space-y-4">
            {/* Workflow Selector */}
            {/* <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Columns className="h-4 w-4" />
                <span className="text-sm font-medium">Workflow:</span>
                <Select value={currentWorkflowId || ""} onValueChange={handleWorkflowChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select workflow" />
                  </SelectTrigger>
                  <SelectContent>
                    {savedWorkflows.map((workflow: any) => (
                      <SelectItem key={workflow.id} value={workflow.id}>
                        {workflow.name}
                        {workflow.isDefault && " (Default)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" size="sm" onClick={() => setWorkflowManagerOpen(true)}>
                Manage Workflows
              </Button>
            </div> */}

            <KanbanBoard
              tasks={tasks}
              workflows={savedWorkflows}
              selectedWorkflowId={currentWorkflowId || undefined}
              onWorkflowChange={handleWorkflowChange}
              onTaskMove={(taskId, newStatus) => {
                // Update task status via API and refresh
                handleTaskStatusUpdate(taskId, newStatus)
              }}
              onTaskEdit={(task) => {
                // Refresh tasks after edit
                handleTaskCreated()
              }}
              onTaskDelete={(taskId) => {
                // Refresh tasks after delete
                handleTaskCreated()
              }}
              onCreateTask={(status) => {
                // Refresh tasks after create
                handleTaskCreated()
              }}
              onColumnReorder={(columns) => {
                setCustomWorkflowColumns(columns)
                // Auto-save if we have a current workflow
                if (currentWorkflowId) {
                  updateWorkflow(currentWorkflowId, columns)
                }
              }}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="list">
          <TasksListView
            tasks={tasks}
            onTaskEdit={(task) => {
              // Refresh tasks after edit
              handleTaskCreated()
            }}
            onTaskDelete={(task) => {
              // Refresh tasks after delete
              handleTaskCreated()
            }}
            onTaskMove={(taskId, newStatus) => {
              // Update task status directly in parent state
              handleTaskStatusUpdate(taskId, newStatus)
            }}
            onTaskCreated={handleTaskCreated}
            projectId={params.id}
            enableRealTimeUpdates={true}
            refreshInterval={15000} // 15 seconds for project-specific view
            workflowStatuses={
              customWorkflowColumns.length > 0
                ? customWorkflowColumns
                : undefined
            }
          />
        </TabsContent>
        
        <TabsContent value="timer" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <TimerWidget taskId={tasks[0]?.id || ""} onTimeLogged={handleTaskCreated} />
            <TimeLogsList taskId={tasks[0]?.id || ""} onTimeLogAdded={handleTaskCreated} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Workflow Dialog */}
      <Dialog open={workflowDialogOpen} onOpenChange={setWorkflowDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Custom Work Flow</DialogTitle>
            <DialogDescription>
              Select custom statuses to add as columns to your workflow. Click Done when finished.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Show current columns */}
            {customWorkflowColumns.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Current Columns ({customWorkflowColumns.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {customWorkflowColumns.map((col) => {
                    // Extract hex color from various formats
                    let hexColor = '#6B7280' // Default gray
                    if (col.color) {
                      if (col.color.startsWith('#')) {
                        hexColor = col.color
                      } else if (col.color.startsWith('bg-[') && col.color.includes(']')) {
                        hexColor = col.color.match(/bg-\[(.*?)\]/)?.[1] || '#6B7280'
                      }
                    }
                    
                    return (
                      <div
                        key={col.id}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-muted group hover:bg-muted/80 transition-colors"
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: hexColor }}
                        />
                        <span className="capitalize">{col.title}</span>
                        <button
                          onClick={() => deleteCustomWorkflowColumn(col.id)}
                          className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                          title="Delete column"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            
            {customStatuses.length === 0 ? (
              <p className="text-muted-foreground">No custom statuses found. Create some in the Custom Fields page first.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium">Add Custom Status Columns:</p>
                <div className="grid gap-2 max-h-[300px] overflow-y-auto">
                  {customStatuses.map((status: any) => {
                    const alreadyAdded = customWorkflowColumns.some(
                      col => col.title === status.name || col.id === status.id
                    )
                    return (
                      <Button
                        key={status.id || status.name}
                        variant={alreadyAdded ? "secondary" : "outline"}
                        className="justify-start"
                        onClick={() => addCustomWorkflowColumn(status)}
                        disabled={alreadyAdded}
                      >
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: status.color || '#gray' }}
                        />
                        {status.name}
                        {alreadyAdded && <span className="ml-auto text-xs text-muted-foreground">✓ Added</span>}
                      </Button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setWorkflowDialogOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Workflow Manager Dialog */}
      <Dialog open={workflowManagerOpen} onOpenChange={setWorkflowManagerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Workflow Manager</DialogTitle>
            <DialogDescription>
              Save your current column setup or load a saved workflow
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Save Current Workflow */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Save Current Setup</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter workflow name"
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const name = (e.target as HTMLInputElement).value.trim()
                      if (name && customWorkflowColumns.length > 0) {
                        saveWorkflow(name, false)
                        ;(e.target as HTMLInputElement).value = ''
                        setWorkflowManagerOpen(false)
                      }
                    }
                  }}
                />
                <Button 
                  size="sm"
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Enter workflow name"]') as HTMLInputElement
                    const name = input?.value.trim()
                    if (name && customWorkflowColumns.length > 0) {
                      saveWorkflow(name, false)
                      input.value = ''
                      setWorkflowManagerOpen(false)
                    }
                  }}
                  disabled={customWorkflowColumns.length === 0}
                >
                  Save
                </Button>
              </div>
              {customWorkflowColumns.length === 0 && (
                <p className="text-xs text-muted-foreground">Add some columns first to save a workflow</p>
              )}
            </div>

            {/* Saved Workflows */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Saved Workflows</h3>
              {savedWorkflows.length === 0 ? (
                <p className="text-muted-foreground text-sm">No saved workflows yet</p>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {savedWorkflows.map((workflow: any) => (
                    <div key={workflow.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <span className="text-sm font-medium truncate">{workflow.name}</span>
                        {workflow.isDefault && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            loadWorkflow(workflow)
                            setWorkflowManagerOpen(false)
                          }}
                          className="text-xs px-2"
                        >
                          Load
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newName = prompt('Enter new name for workflow:', workflow.name)
                            if (newName && newName.trim() && newName !== workflow.name) {
                              // Update workflow name
                              fetch(`/api/workflows/${workflow.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ name: newName.trim() })
                              }).then(() => {
                                loadSavedWorkflows() // Refresh the list
                              })
                            }
                          }}
                          className="text-xs px-2 h-7"
                          title="Rename workflow"
                        >
                          ✏️
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Delete "${workflow.name}"? This cannot be undone.`)) {
                              fetch(`/api/workflows/${workflow.id}`, {
                                method: 'DELETE'
                              }).then(() => {
                                loadSavedWorkflows() // Refresh the list
                              })
                            }
                          }}
                          className="text-xs px-2 h-7 text-red-600 hover:text-red-700"
                          title="Delete workflow"
                        >
                          🗑️
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
