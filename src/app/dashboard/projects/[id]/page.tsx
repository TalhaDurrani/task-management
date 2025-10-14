"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Users, CheckSquare, Clock } from "lucide-react"
import Link from "next/link"
import { WorkflowManager } from "@/components/workflows/workflow-manager"

// Interfaces
interface User {
  id: string
  name?: string
  email: string
}

interface TimeLog {
  id: string
  hoursSpent: number
}

interface Task {
  id: string
  label?: string
  status: "PENDING" | "IN_PROGRESS" | "DONE"
  timeLogs?: TimeLog[]
  assignee?: User
}

interface Project {
  id: string
  title: string
  description?: string
  owner?: User
  noOfAssignedUsers?: number
}

interface AuthResponse {
  success: boolean
  user?: User
}

interface ProjectPageProps {
  params: {
    id: string
  }
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current user from the auth API
        const response = await fetch("/api/auth/login", { method: "GET" })
        const result: AuthResponse = await response.json()

        if (result.success && result.user) {
          setCurrentUser(result.user)

          // Load project data
          const projectResponse = await fetch(`/api/projects/${params.id}`)
          if (projectResponse.ok) {
            const projectData: Project = await projectResponse.json()
            setProject(projectData)
          }

          // Load tasks data
          const tasksResponse = await fetch(`/api/tasks?projectId=${params.id}`)
          if (tasksResponse.ok) {
            const tasksData: Task[] = await tasksResponse.json()
            setTasks(tasksData)
          }
        } else {
          window.location.href = "/auth/signin"
        }
      } catch (error) {
        console.error("Error loading project data:", error)
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
          <p className="text-muted-foreground mb-4">
            The project you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => router.push("/dashboard/projects")}>Back to Projects</Button>
        </div>
      </div>
    )
  }

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "PENDING").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    done: tasks.filter((t) => t.status === "DONE").length,
  }

  const totalLoggedHours = tasks.reduce((sum, task) => {
    const taskHours =
      task.timeLogs?.reduce((logSum, log) => logSum + (log.hoursSpent || 0), 0) || 0
    return sum + taskHours
  }, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
          {project.description && <p className="text-muted-foreground mt-2">{project.description}</p>}
        </div>
        <Button asChild>
          <Link href={`/dashboard/projects/${project.id}/tasks`}>View Tasks</Link>
        </Button>
      </div>

      {/* Stats */}
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

      {/* Team & Tasks */}
      <Card>
  <CardHeader>
    <CardTitle>Team Members</CardTitle>
    <CardDescription>People working on this project</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr className="text-left">
            <th className="px-4 py-2 font-medium text-muted-foreground">Member</th>
            <th className="px-4 py-2 font-medium text-muted-foreground">Email</th>
            <th className="px-4 py-2 font-medium text-muted-foreground">Role</th>
            <th className="px-4 py-2 font-medium text-muted-foreground text-center">Tasks</th>
          </tr>
        </thead>
        <tbody>
          {project.owner && (
            <tr className="border-t">
              <td className="px-4 py-3 flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {project.owner.name?.[0] || project.owner.email[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{project.owner.name || project.owner.email}</span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {project.owner.email}
              </td>
              <td className="px-4 py-3">
                <Badge variant="secondary">Owner</Badge>
              </td>
              <td className="px-4 py-3 text-center text-muted-foreground">
                {tasks.length}
              </td>
            </tr>
          )}

          {/* Example: team members inferred from task assignees */}
          {tasks
            .filter((t) => t.assignee)
            .map((t) => t.assignee!)
            .reduce((unique, user) => {
              if (!unique.find((u) => u.id === user.id)) unique.push(user)
              return unique
            }, [] as User[])
            .map((member) => {
              const memberTasks = tasks.filter((t) => t.assignee?.id === member.id)
              return (
                <tr key={member.id} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{member.name?.[0] || member.email[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{member.name || member.email}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">Member</Badge>
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground">
                    {memberTasks.length}
                  </td>
                </tr>
              )
            })}

          {!project.owner && tasks.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                No team members yet. Invite someone or assign a task.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </CardContent>
</Card>

      {/* Workflow Management */}
      {/* <WorkflowManager projectId={project.id} /> */}
    </div>
  )
}
