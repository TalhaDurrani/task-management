"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
// Removed service imports - using API calls instead
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Users, CheckSquare, Clock } from "lucide-react"
import Link from "next/link"
import { processTaskStatus, getStatusBadgeVariant } from "@/types"

interface ProjectPageProps {
  params: {
    id: string
  }
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const [currentUser, setCurrentUser] = useState(null)
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

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
            setTasks(tasksData)
          }
        } else {
          // Redirect to sign-in if not authenticated
          window.location.href = "/auth/signin"
        }
      } catch (error) {
        console.error('Error loading project data:', error)
        // Redirect to sign-in on error
        window.location.href = "/auth/signin"
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [params.id])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project...</p>
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

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'PENDING').length,
    inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    done: tasks.filter((t) => t.status === 'DONE').length,
  }

  const totalLoggedHours = tasks.reduce((sum, task) => {
    return sum + (task.timeLogs?.reduce((logSum, log) => logSum + log.hoursSpent, 0) || 0)
  }, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
          {project.description && <p className="text-muted-foreground mt-2">{project.description}</p>}
        </div>
        <Button asChild>
          <Link href={`/dashboard/projects/${project.id}/tasks`}>View Tasks</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.done}</div>
            <p className="text-xs text-muted-foreground">
              {taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0}% complete
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.noOfAssignedUsers || 1}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>People working on this project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {project.owner && (
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>{project.owner.name?.[0] || project.owner.email[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{project.owner.name || project.owner.email}</p>
                    <p className="text-sm text-muted-foreground">{project.owner.email}</p>
                  </div>
                  <Badge variant="secondary">Owner</Badge>
                </div>
              )}
              {tasks.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to team members
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
            <CardDescription>Latest tasks in this project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{task.label || 'Untitled Task'}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge
                        variant={
                          task.status === 'DONE' ? 'default' :
                          task.status === 'IN_PROGRESS' ? 'secondary' : 'outline'
                        }
                        className="text-xs"
                      >
                        {task.status}
                      </Badge>
                      {task.assignee && (
                        <Badge variant="outline" className="text-xs">
                          {task.assignee.name || task.assignee.email}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-sm text-muted-foreground">No tasks yet. Create your first task!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
