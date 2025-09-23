"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Users, 
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Download,
  Filter
} from "lucide-react"

export default function ReportsPage() {
  const [currentUser, setCurrentUser] = useState(null)
  const [projectStats, setProjectStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalEstimatedHours: 0,
    totalHoursLogged: 0
  })
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    averageTasksPerUser: 0,
    completionRate: 0
  })
  const [timeLogs, setTimeLogs] = useState([])
  const [projects, setProjects] = useState([])
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
          
          // Load projects
          const projectsResponse = await fetch('/api/projects')
          if (projectsResponse.ok) {
            const projectsData = await projectsResponse.json()
            setProjects(projectsData)
            
            // Load tasks from all projects
            const allTasksData = []
            for (const project of projectsData) {
              try {
                const tasksResponse = await fetch(`/api/tasks?projectId=${project.id}`)
                if (tasksResponse.ok) {
                  const tasksData = await tasksResponse.json()
                  allTasksData.push(...tasksData)
                }
              } catch (error) {
                console.error(`Error loading tasks for project ${project.id}:`, error)
              }
            }
            setTasks(allTasksData)
            
            // Calculate project stats
            const totalProjects = projectsData.length
            const activeProjects = projectsData.filter(p => !p.completedAt).length
            const completedProjects = projectsData.filter(p => p.completedAt).length
            
            const totalTasks = allTasksData.length
            const completedTasks = allTasksData.filter(t => t.status === 'DONE').length
            
            const totalEstimatedHours = allTasksData.reduce((sum, task) => sum + (task.estimatedHours || 0), 0)
            const totalHoursLogged = allTasksData.reduce((sum, task) => {
              return sum + (task.timeLogs?.reduce((logSum, log) => logSum + log.hoursSpent, 0) || 0)
            }, 0)

            setProjectStats({
              totalProjects,
              activeProjects,
              completedProjects,
              totalTasks,
              completedTasks,
              totalEstimatedHours,
              totalHoursLogged
            })

            // Calculate user stats
            setUserStats({
              totalUsers: 1, // Current user
              activeUsers: 1,
              averageTasksPerUser: totalTasks,
              completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
            })
          }
          
          // Load time logs
          const timeLogsResponse = await fetch('/api/time-logs')
          if (timeLogsResponse.ok) {
            const timeLogsData = await timeLogsResponse.json()
            setTimeLogs(timeLogsData)
          }
        } else {
          // Redirect to sign-in if not authenticated
          window.location.href = "/auth/signin"
        }
      } catch (error) {
        console.error('Error loading reports data:', error)
        // Redirect to sign-in on error
        window.location.href = "/auth/signin"
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    )
  }

  // Calculate additional statistics
  const totalHoursThisWeek = timeLogs
    .filter(log => {
      const logDate = new Date(log.logDate)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return logDate >= weekAgo
    })
    .reduce((sum, log) => sum + log.hoursSpent, 0)

  const averageTaskCompletion = tasks.length > 0 
    ? (tasks.filter(t => t.status === "done").length / tasks.length) * 100 
    : 0

  const overdueTasks = tasks.filter(task => {
    const dueDate = new Date(task.timelineEnd)
    const now = new Date()
    return dueDate < now && task.status !== "done"
  })

  const timeEfficiency = projectStats.totalEstimatedHours > 0
    ? (projectStats.totalHoursLogged / projectStats.totalEstimatedHours) * 100
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Insights and performance metrics for your projects
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats.totalHoursLogged}h</div>
            <p className="text-xs text-muted-foreground">
              {totalHoursThisWeek}h this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageTaskCompletion.toFixed(1)}%</div>
            <div className="mt-2">
              <Progress value={averageTaskCompletion} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{timeEfficiency.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              of estimated time used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {overdueTasks.length === 0 ? "All on track" : "Need attention"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="time">Time Tracking</TabsTrigger>
          <TabsTrigger value="team">Team Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Project Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Project Progress</CardTitle>
                <CardDescription>Completion status across all projects</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {projects.map((project) => {
                  const projectTasks = tasks.filter(t => t.projectId === project.id)
                  const completedTasks = projectTasks.filter(t => t.status === "done").length
                  const progress = projectTasks.length > 0 ? (completedTasks / projectTasks.length) * 100 : 0
                  
                  return (
                    <div key={project.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{project.name}</h4>
                        <span className="text-sm text-muted-foreground">
                          {completedTasks}/{projectTasks.length} tasks
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {progress.toFixed(1)}% complete
                      </p>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Time Logs</CardTitle>
                <CardDescription>Latest time tracking entries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{log.task.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {log.user.name} • {log.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.logDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {log.hoursSpent}h
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid gap-6">
            {projects.map((project) => {
              const projectTasks = tasks.filter(t => t.projectId === project.id)
              const completedTasks = projectTasks.filter(t => t.status === "done").length
              const inProgressTasks = projectTasks.filter(t => t.status === "in-progress").length
              const todoTasks = projectTasks.filter(t => t.status === "todo").length
              const totalHours = projectTasks.reduce((sum, task) => sum + task.loggedHours, 0)
              const estimatedHours = projectTasks.reduce((sum, task) => sum + task.estimatedHours, 0)
              
              return (
                <Card key={project.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{project.name}</CardTitle>
                        <CardDescription>{project.description}</CardDescription>
                      </div>
                      <Badge variant="outline">
                        {project.members.length} members
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{completedTasks}</div>
                        <p className="text-sm text-muted-foreground">Completed</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{inProgressTasks}</div>
                        <p className="text-sm text-muted-foreground">In Progress</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{todoTasks}</div>
                        <p className="text-sm text-muted-foreground">To Do</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{totalHours}h</div>
                        <p className="text-sm text-muted-foreground">of {estimatedHours}h</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Time Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Time Distribution</CardTitle>
                <CardDescription>Hours logged by project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.map((project) => {
                    const projectTasks = tasks.filter(t => t.projectId === project.id)
                    const totalHours = projectTasks.reduce((sum, task) => sum + task.loggedHours, 0)
                    const percentage = projectStats.totalHoursLogged > 0 
                      ? (totalHours / projectStats.totalHoursLogged) * 100 
                      : 0
                    
                    return (
                      <div key={project.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{project.name}</span>
                          <span className="text-sm text-muted-foreground">{totalHours}h</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Weekly Time Logs */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Time Logs</CardTitle>
                <CardDescription>Time logged this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeLogs
                    .filter(log => {
                      const logDate = new Date(log.logDate)
                      const weekAgo = new Date()
                      weekAgo.setDate(weekAgo.getDate() - 7)
                      return logDate >= weekAgo
                    })
                    .map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{log.task.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {log.user.name} • {log.task.project.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">{log.hoursSpent}h</Badge>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.logDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Performance</CardTitle>
                <CardDescription>Individual team member statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockProjects.flatMap(p => p.members).map((member) => {
                    const userTasks = tasks.filter(t => t.assigneeId === member.userId)
                    const completedTasks = userTasks.filter(t => t.status === "done").length
                    const totalHours = userTasks.reduce((sum, task) => sum + task.loggedHours, 0)
                    
                    return (
                      <div key={member.userId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {member.user.name?.[0] || "U"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{member.user.name}</p>
                            <p className="text-sm text-muted-foreground">{member.user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <div className="text-lg font-bold">{completedTasks}</div>
                            <p className="text-xs text-muted-foreground">Completed</p>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold">{totalHours}h</div>
                            <p className="text-xs text-muted-foreground">Logged</p>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold">{userTasks.length}</div>
                            <p className="text-xs text-muted-foreground">Total Tasks</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
