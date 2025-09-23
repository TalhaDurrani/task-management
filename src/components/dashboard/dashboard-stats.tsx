"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Users, 
  FolderOpen, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  Target,
  Zap
} from "lucide-react"

interface DashboardStatsProps {
  projects?: any[]
  tasks?: any[]
}

export function DashboardStats({ projects = [], tasks = [] }: DashboardStatsProps) {
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

  useEffect(() => {
    // Calculate project stats
    const totalProjects = projects.length
    const activeProjects = projects.filter(p => !p.completedAt).length
    const completedProjects = projects.filter(p => p.completedAt).length
    
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'DONE').length
    
    const totalEstimatedHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0)
    const totalHoursLogged = tasks.reduce((sum, task) => {
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

    // Calculate user stats (simplified for now)
    setUserStats({
      totalUsers: 1, // Current user
      activeUsers: 1,
      averageTasksPerUser: totalTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    })
  }, [projects, tasks])

  const completionRate = projectStats.totalTasks > 0 
    ? (projectStats.completedTasks / projectStats.totalTasks) * 100 
    : 0

  const timeEfficiency = projectStats.totalEstimatedHours > 0
    ? (projectStats.totalHoursLogged / projectStats.totalEstimatedHours) * 100
    : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Project Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{projectStats.totalProjects}</div>
          <p className="text-xs text-muted-foreground">
            {projectStats.activeProjects} active, {projectStats.completedProjects} completed
          </p>
        </CardContent>
      </Card>

      {/* Task Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{projectStats.totalTasks}</div>
          <div className="flex items-center space-x-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              {projectStats.completedTasks} done
            </Badge>
            <Badge variant="outline" className="text-xs">
              {projectStats.inProgressTasks} in progress
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Time Tracking */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Hours Logged</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{projectStats.totalHoursLogged}h</div>
          <p className="text-xs text-muted-foreground">
            of {projectStats.totalEstimatedHours}h estimated
          </p>
          <div className="mt-2">
            <Progress value={timeEfficiency} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {timeEfficiency.toFixed(1)}% of estimated time
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Completion Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
          <div className="mt-2">
            <Progress value={completionRate} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {projectStats.completedTasks} of {projectStats.totalTasks} tasks completed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* User Performance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Your Tasks</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{userStats.totalTasksAssigned}</div>
          <div className="flex items-center space-x-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              {userStats.completedTasks} done
            </Badge>
            <Badge variant="outline" className="text-xs">
              {userStats.inProgressTasks} active
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Productivity Score */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Productivity</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{userStats.productivityScore}%</div>
          <div className="mt-2">
            <Progress value={userStats.productivityScore} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Based on task completion and time efficiency
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Hours Logged */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Your Hours</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{userStats.totalHoursLogged}h</div>
          <p className="text-xs text-muted-foreground">
            Total time logged this month
          </p>
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alerts</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{projectStats.overdueTasks}</div>
          <p className="text-xs text-muted-foreground">
            {projectStats.overdueTasks === 0 ? "No overdue tasks" : "Overdue tasks"}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
