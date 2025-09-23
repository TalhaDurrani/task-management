"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, TrendingUp, Target } from "lucide-react"

interface TimeLog {
  id: string
  hoursSpent: number
  logDate: Date
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  task: {
    id: string
    title: string
    estimatedHours: number | null
    loggedHours: number
    project: {
      id: string
      name: string
    }
  }
}

interface Project {
  id: string
  name: string
}

interface TimeTrackingDashboardProps {
  timeLogs: TimeLog[]
  projects: Project[]
}

export function TimeTrackingDashboard({ timeLogs, projects }: TimeTrackingDashboardProps) {
  const [selectedProject, setSelectedProject] = useState<string>("all")

  const filteredLogs = useMemo(() => {
    if (selectedProject === "all") return timeLogs
    return timeLogs.filter((log) => log.task.project.id === selectedProject)
  }, [timeLogs, selectedProject])

  const projectStats = useMemo(() => {
    const stats = new Map()

    filteredLogs.forEach((log) => {
      const projectId = log.task.project.id
      const projectName = log.task.project.name

      if (!stats.has(projectId)) {
        stats.set(projectId, {
          id: projectId,
          name: projectName,
          totalHours: 0,
          totalEstimated: 0,
          taskCount: new Set(),
        })
      }

      const projectStat = stats.get(projectId)
      projectStat.totalHours += log.hoursSpent
      projectStat.taskCount.add(log.task.id)
    })

    // Calculate estimated hours for each project
    const taskEstimates = new Map()
    filteredLogs.forEach((log) => {
      if (log.task.estimatedHours && !taskEstimates.has(log.task.id)) {
        taskEstimates.set(log.task.id, {
          projectId: log.task.project.id,
          estimated: log.task.estimatedHours,
        })
      }
    })

    taskEstimates.forEach((estimate) => {
      if (stats.has(estimate.projectId)) {
        stats.get(estimate.projectId).totalEstimated += estimate.estimated
      }
    })

    return Array.from(stats.values()).map((stat) => ({
      ...stat,
      taskCount: stat.taskCount.size,
      efficiency: stat.totalEstimated > 0 ? (stat.totalEstimated / stat.totalHours) * 100 : 0,
    }))
  }, [filteredLogs])

  const topContributors = useMemo(() => {
    const contributors = new Map()

    filteredLogs.forEach((log) => {
      const userId = log.user.id
      if (!contributors.has(userId)) {
        contributors.set(userId, {
          user: log.user,
          totalHours: 0,
          taskCount: new Set(),
        })
      }

      const contributor = contributors.get(userId)
      contributor.totalHours += log.hoursSpent
      contributor.taskCount.add(log.task.id)
    })

    return Array.from(contributors.values())
      .map((contributor) => ({
        ...contributor,
        taskCount: contributor.taskCount.size,
      }))
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 5)
  }, [filteredLogs])

  const recentActivity = useMemo(() => {
    return filteredLogs.slice(0, 10)
  }, [filteredLogs])

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Project Performance</span>
            </CardTitle>
            <CardDescription>Time spent vs estimated hours by project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projectStats.map((project) => (
                <div key={project.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{project.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {project.totalHours.toFixed(1)}h
                        {project.totalEstimated > 0 && ` / ${project.totalEstimated.toFixed(1)}h`}
                      </span>
                      {project.totalEstimated > 0 && (
                        <Badge
                          variant={
                            project.efficiency >= 90
                              ? "default"
                              : project.efficiency >= 70
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {project.efficiency.toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  {project.totalEstimated > 0 && (
                    <Progress value={Math.min((project.totalHours / project.totalEstimated) * 100, 100)} />
                  )}
                  <p className="text-xs text-muted-foreground">{project.taskCount} tasks</p>
                </div>
              ))}
              {projectStats.length === 0 && (
                <p className="text-sm text-muted-foreground">No time logs found for the selected project.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Top Contributors</span>
            </CardTitle>
            <CardDescription>Team members by hours logged</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topContributors.map((contributor, index) => (
                <div key={contributor.user.id} className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 flex-1">
                    <span className="text-sm font-medium text-muted-foreground w-4">#{index + 1}</span>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={contributor.user.image || ""} />
                      <AvatarFallback className="text-xs">
                        {contributor.user.name?.[0] || contributor.user.email[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{contributor.user.name || contributor.user.email}</p>
                      <p className="text-xs text-muted-foreground">{contributor.taskCount} tasks</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{contributor.totalHours.toFixed(1)}h</p>
                  </div>
                </div>
              ))}
              {topContributors.length === 0 && (
                <p className="text-sm text-muted-foreground">No contributors found for the selected project.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
          <CardDescription>Latest time entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((log) => (
              <div key={log.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={log.user.image || ""} />
                    <AvatarFallback className="text-xs">{log.user.name?.[0] || log.user.email[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{log.task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.task.project.name} • {log.user.name || log.user.email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">{log.hoursSpent}h</p>
                  <p className="text-xs text-muted-foreground">{new Date(log.logDate).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && <p className="text-sm text-muted-foreground">No recent activity found.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
