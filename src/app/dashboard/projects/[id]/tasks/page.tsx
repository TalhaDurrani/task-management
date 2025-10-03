"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
// Removed service imports - using API calls instead
import { KanbanBoard } from "@/components/tasks/kanban-board"
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog"
import { TasksListView } from "@/components/tasks/tasks-list-view"
import { TimerWidget } from "@/components/timer/timer-widget"
import { TimeLogsList } from "@/components/timer/time-logs-list"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, ArrowLeft, Clock, List, Table } from "lucide-react"
import Link from "next/link"

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

export default function TasksPage({ params }: TasksPageProps) {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [project, setProject] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
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
        <CreateTaskDialog projectId={params.id} onTaskCreated={handleTaskCreated}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </CreateTaskDialog>
      </div>

      <Tabs defaultValue="kanban" className="space-y-4">
        <TabsList>
          <TabsTrigger value="kanban" className="flex items-center gap-2">
            <List className="h-4 w-4" />
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
            onTaskMove={(taskId, newStatus) => console.log(`Moving task ${taskId} to ${newStatus}`)}
            onTaskEdit={(task) => console.log("Edit task:", task)}
            onTaskDelete={(taskId) => console.log("Delete task:", taskId)}
            onCreateTask={(status) => console.log(`Creating task with status: ${status}`)}
          />
        </TabsContent>
        
        <TabsContent value="list">
          <TasksListView
            tasks={tasks}
            onTaskEdit={(task) => {}}
            onTaskDelete={(task) => {}}
            onTaskMove={(taskId, newStatus) => {
            handleTaskCreated() // Refresh data when status changes
          }}
            onTaskCreated={handleTaskCreated}
            projectId={params.id}
            enableRealTimeUpdates={true}
            refreshInterval={15000} // 15 seconds for project-specific view
          />
        </TabsContent>
        
        <TabsContent value="timer" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <TimerWidget taskId={tasks[0]?.id || ""} onTimeLogged={handleTaskCreated} />
            <TimeLogsList taskId={tasks[0]?.id || ""} onTimeLogAdded={handleTaskCreated} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
