"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ActivityFeed } from "@/components/activity/activity-feed"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { QuickActions } from "@/components/dashboard/quick-actions"
// Remove old hardcoded auth import

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState(null)
  const [projects, setProjects] = useState([])
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
          // Load projects data from API
          const projectsResponse = await fetch('/api/projects')
          if (projectsResponse.ok) {
            const projectsData = await projectsResponse.json()
            setProjects(projectsData)
          }
        } else {
          // Redirect to sign in if no session
          router.push("/auth/signin?callbackUrl=/dashboard")
        }
      } catch (error) {
        console.error('Failed to load user data:', error)
        router.push("/auth/signin?callbackUrl=/dashboard")
      }
      setIsLoading(false)
    }
    
    loadData()
  }, [router])
  
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

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Not Authenticated</h3>
              <p className="text-muted-foreground">
                Please sign in to access the dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get task counts across all projects
  const taskCounts = {
    total: 0,
    todo: 0,
    inProgress: 0,
    done: 0,
  }

  for (const project of projects) {
    taskCounts.total += project.tasks.length
    taskCounts.todo += project.tasks.filter((t) => t.status === "todo").length
    taskCounts.inProgress += project.tasks.filter((t) => t.status === "in_progress").length
    taskCounts.done += project.tasks.filter((t) => t.status === "done").length
  }

  // Get all tasks from all projects
  const allTasks = projects.flatMap(p => p.tasks || [])
  
  // Get projects for activity feed
  const projectsForActivity = projects.map(p => ({
    id: p.id,
    name: p.title || p.name
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {currentUser.name}! Here's what's happening with your projects.
        </p>
        {currentUser.organization && currentUser.workspace && (
          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
            <span>Organization: <span className="font-medium">{currentUser.organization.name}</span></span>
            <span>Workspace: <span className="font-medium">{currentUser.workspace.name}</span></span>
          </div>
        )}
      </div>

      <DashboardStats projects={projects} tasks={allTasks} />

      <div className="grid gap-6 md:grid-cols-2">
        <QuickActions />
        <ActivityFeed projects={projectsForActivity} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>Your most recently updated projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.slice(0, 5).map((project) => (
                <div key={project.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{project.title || project.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {project.tasks?.length || 0} tasks • {project.members?.length || 0} members
                    </p>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <p className="text-sm text-muted-foreground">No projects yet. Create your first project!</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
            <CardDescription>Tasks due in the next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.flatMap(p => p.tasks).filter(task => {
                const dueDate = new Date(task.timelineEnd)
                const now = new Date()
                const diffTime = dueDate.getTime() - now.getTime()
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                return diffDays <= 7 && diffDays >= 0 && task.status !== "done"
              }).slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {task.project.name} • Due {new Date(task.timelineEnd).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.priority === "critical" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                    task.priority === "high" ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" :
                    task.priority === "medium" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                    "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                  }`}>
                    {task.priority}
                  </div>
                </div>
              ))}
              {projects.flatMap(p => p.tasks).filter(task => {
                const dueDate = new Date(task.timelineEnd)
                const now = new Date()
                const diffTime = dueDate.getTime() - now.getTime()
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                return diffDays <= 7 && diffDays >= 0 && task.status !== "done"
              }).length === 0 && (
                <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
