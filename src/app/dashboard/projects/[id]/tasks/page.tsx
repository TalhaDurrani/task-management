"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, ArrowLeft, Clock, List, Table, Circle, AlertCircle, CheckCircle2, Star, Zap, Target, Flag } from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

interface TasksPageProps {
  params: {
    id: string
  }
}
export const mapStatusToUI = (apiStatus: string) => {
    switch (apiStatus) {
      case 'TODO': return 'todo'
      case 'PENDING': return 'todo'
      case 'IN_PROGRESS': return 'in-progress'
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
      status: mapStatusToUI(task.status),
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
            setProject(projectData)
          }
          
          // Load tasks data from API
          const tasksResponse = await fetch(`/api/tasks?projectId=${params.id}`)
          if (tasksResponse.ok) {
            const tasksData = await tasksResponse.json()
            console.log("Raw API tasks data:", tasksData)
            
            // Transform the data for UI components
            const transformedTasks = transformTaskData(tasksData)
            setTasks(transformedTasks)
            console.log("Transformed tasks:", transformedTasks)
          }
        } else {
          // Redirect to sign-in if not authenticated
          window.location.href = "/auth/signin"
        }
      } catch (error) {
        console.error('Error loading tasks data:', error)
        // Redirect to sign-in on error
        window.location.href = "/auth/signin"
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [params.id])

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

  const handleTaskStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      // Map UI status back to API status for default statuses
      let apiStatus = newStatus
      if (newStatus === 'todo') apiStatus = 'TODO'
      else if (newStatus === 'in-progress') apiStatus = 'IN_PROGRESS'
      else if (newStatus === 'done') apiStatus = 'DONE'
      // For custom statuses, use the status name as-is
      
      console.log(`Updating task ${taskId} to status ${apiStatus}`)
      
      // Update task status via API
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: apiStatus
        })
      })

      if (response.ok) {
        console.log('Task status updated successfully')
        // Refresh tasks after successful update
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

  const addCustomWorkflowColumn = async (status: any) => {
    // Create a column object for the custom status
    const newColumn = {
      id: status.name.toLowerCase().replace(/\s+/g, '-'), // Convert to slug
      title: status.name,
      color: status.color ? `bg-[${status.color}]` : 'bg-blue-100 dark:bg-blue-900',
      icon: Circle, // Default icon, could be enhanced later
      count: 0
    }

    let updatedColumns = [...customWorkflowColumns]

    // If this is the first custom column, include default columns
    if (updatedColumns.length === 0) {
      updatedColumns = [
        {
          id: "todo",
          title: "To Do",
          color: "bg-gray-100 dark:bg-gray-800",
          icon: Circle,
          count: 0
        },
        {
          id: "in-progress",
          title: "In Progress",
          color: "bg-yellow-100 dark:bg-yellow-900",
          icon: AlertCircle,
          count: 0
        },
        {
          id: "done",
          title: "Done",
          color: "bg-green-100 dark:bg-green-900",
          icon: CheckCircle2,
          count: 0
        }
      ]
    }

    // Check if column already exists
    if (!updatedColumns.some(col => col.id === newColumn.id)) {
      updatedColumns.push(newColumn)
    }

    setCustomWorkflowColumns(updatedColumns)

    // Auto-save the workflow
    try {
      if (currentWorkflowId) {
        // Update existing workflow
        await updateWorkflow(currentWorkflowId, updatedColumns)
      } else {
        // Create a new temporary workflow and set it as default if none exists
        const tempWorkflow = await saveWorkflow(`Auto-saved Workflow - ${new Date().toLocaleDateString()}`, true)
        setCurrentWorkflowId(tempWorkflow.id)
      }
    } catch (error) {
      console.error('Failed to auto-save workflow:', error)
    }

    setWorkflowDialogOpen(false)
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
          <Button variant="outline" onClick={() => setWorkflowManagerOpen(true)}>
            <List className="mr-2 h-4 w-4" />
            Manage Workflows
          </Button>
        </div>
      </div>

      <Tabs defaultValue="kanban" className="space-y-4">
        <TabsList>
          <TabsTrigger value="kanban" className="flex items-center gap-2">
            Kanban Board
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
          <KanbanBoard 
            tasks={tasks} 
            customColumns={customWorkflowColumns.length > 0 ? customWorkflowColumns : [
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
            ]}
            onTaskMove={(taskId, newStatus) => {
              // Update task status via API and refresh
              handleTaskStatusUpdate(taskId, newStatus)
            }}
            onTaskEdit={(task) => {
              console.log("Edit task:", task)
              // Refresh tasks after edit
              handleTaskCreated()
            }}
            onTaskDelete={(taskId) => {
              console.log("Delete task:", taskId)
              // Refresh tasks after delete
              handleTaskCreated()
            }}
            onCreateTask={(status) => {
              console.log(`Creating task with status: ${status}`)
              // Refresh tasks after create
              handleTaskCreated()
            }}
            onColumnReorder={(columns) => {
              console.log('Columns reordered:', columns)
              setCustomWorkflowColumns(columns)
              // Auto-save if we have a current workflow
              if (currentWorkflowId) {
                updateWorkflow(currentWorkflowId, columns)
              }
            }}
          />
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
              // TasksListView already makes the API call in handleStatusChange
              // We just need to refresh the parent's task list after the update
              console.log(`List view updated task ${taskId} to ${newStatus}, refreshing...`)
              handleTaskCreated()
            }}
            onTaskCreated={handleTaskCreated}
            projectId={params.id}
            enableRealTimeUpdates={true}
            refreshInterval={15000} // 15 seconds for project-specific view
            workflowStatuses={customWorkflowColumns.length > 0 ? customWorkflowColumns : undefined}
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
              Select a custom status to add as a new column to your workflow
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {customStatuses.length === 0 ? (
              <p className="text-muted-foreground">No custom statuses found. Create some in the Custom Fields page first.</p>
            ) : (
              <div className="grid gap-2">
                {customStatuses.map((status: any) => (
                  <Button
                    key={status.id || status.name}
                    variant="outline"
                    className="justify-start"
                    onClick={() => addCustomWorkflowColumn(status)}
                  >
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: status.color || '#gray' }}
                    />
                    {status.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
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
