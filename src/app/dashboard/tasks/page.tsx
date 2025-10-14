"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  CheckSquare,
  FolderOpen
} from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWorkspace } from "@/components/providers/workspace-provider"
import { TasksListView } from "@/components/tasks/tasks-list-view"
import Link from "next/link"

export default function TasksPage() {
  const { selectedWorkspace } = useWorkspace()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [tasksByProject, setTasksByProject] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      if (!selectedWorkspace) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch('/api/auth/login', {
          method: 'GET'
        })
        const result = await response.json()
        
        if (!result.success || !result.user) {
          if (response.status === 401) {
            router.push("/auth/signin?callbackUrl=/dashboard/tasks")
          }
          return
        }
        
        setCurrentUser(result.user)
        
        // Load projects for selected workspace
        try {
          const projectsResponse = await fetch(`/api/projects?workspaceId=${selectedWorkspace.id}`)
          if (projectsResponse.ok) {
            const projectsData = await projectsResponse.json()
            
            // Load tasks for each project and group by project
            const tasksByProj: Record<string, any> = {}
            
            for (const project of projectsData) {
              try {
                const tasksResponse = await fetch(`/api/tasks?projectId=${project.id}`)
                if (tasksResponse.ok) {
                  const tasksData = await tasksResponse.json()
                  
                  // Filter tasks assigned to current user
                  // Note: assignees are user objects with 'id' field, not 'userId'
                  const userTasks = tasksData.filter((task: any) => 
                    task.assignees?.some((assignee: any) => assignee.id === result.user.id)
                  )
                  
                  if (userTasks.length > 0) {
                    tasksByProj[project.id] = {
                      project: project,
                      tasks: userTasks
                    }
                  }
                } else {
                  console.error(`Failed to load tasks for project ${project.id}: ${tasksResponse.status}`)
                }
              } catch (error) {
                console.error(`Error loading tasks for project ${project.id}:`, error)
              }
            }
            
            setTasksByProject(tasksByProj)
          } else {
            console.error('Failed to load projects:', projectsResponse.status)
          }
        } catch (error) {
          console.error('Failed to load tasks data:', error)
        }
      } catch (error) {
        console.error('Failed to check authentication:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [router, selectedWorkspace?.id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!selectedWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No Workspace Selected</h3>
          <p className="text-muted-foreground">Please select a workspace from the sidebar to view your tasks.</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Not Authenticated</h3>
          <p className="text-muted-foreground">Please sign in to access tasks.</p>
        </div>
      </div>
    )
  }

  const handleTaskUpdate = async () => {
    // Reload tasks after any update
    if (!selectedWorkspace || !currentUser) return
    
    try {
      const projectsResponse = await fetch(`/api/projects?workspaceId=${selectedWorkspace.id}`)
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json()
        const tasksByProj: Record<string, any> = {}
        
        for (const project of projectsData) {
          try {
            const tasksResponse = await fetch(`/api/tasks?projectId=${project.id}`)
            if (tasksResponse.ok) {
              const tasksData = await tasksResponse.json()
              const userTasks = tasksData.filter((task: any) => 
                task.assignees?.some((assignee: any) => assignee.id === currentUser.id)
              )
              
              if (userTasks.length > 0) {
                tasksByProj[project.id] = {
                  project: project,
                  tasks: userTasks
                }
              }
            }
          } catch (error) {
            console.error(`Error loading tasks for project ${project.id}:`, error)
          }
        }
        
        setTasksByProject(tasksByProj)
      }
    } catch (error) {
      console.error('Failed to reload tasks:', error)
    }
  }

  const totalTasks = Object.values(tasksByProject).reduce((sum, data) => sum + data.tasks.length, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
          <p className="text-muted-foreground">
            {totalTasks} task{totalTasks !== 1 ? 's' : ''} assigned to you in {selectedWorkspace.name}
          </p>
        </div>
      </div>

      {/* Tasks Grouped by Project */}
      <div className="space-y-6">
        {Object.keys(tasksByProject).length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Tasks Assigned</h3>
              <p className="text-muted-foreground text-center">
                You don't have any tasks assigned to you in this workspace yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {Object.entries(tasksByProject).map(([projectId, data]) => (
              <Card key={projectId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FolderOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">
                          <Link 
                            href={`/dashboard/projects/${data.project.id}/tasks`}
                            className="hover:underline"
                          >
                            {data.project.title}
                          </Link>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {data.tasks.length} task{data.tasks.length !== 1 ? 's' : ''} assigned to you
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {data.tasks.filter((t: any) => t.status === 3).length} / {data.tasks.length} completed
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <TasksListView
                    tasks={data.tasks}
                    onTaskEdit={handleTaskUpdate}
                    onTaskDelete={handleTaskUpdate}
                    onTaskMove={handleTaskUpdate}
                    onTaskCreated={handleTaskUpdate}
                    projectId={projectId}
                    enableRealTimeUpdates={false}
                  />
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
