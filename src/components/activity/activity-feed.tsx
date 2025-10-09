"use client"

import { useState, useEffect, useMemo } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { MessageSquare, Clock, CheckSquare, Activity } from "lucide-react"
interface ActivityItem {
  id: string
  type: string
  title: string
  message: string
  taskId?: string
  projectId?: string
  user: {
    id: string
    name: string | null
    email: string
    role: string
    image?: string
  } | null
  createdAt: Date
}

interface Project {
  id: string
  name: string
}

interface ActivityFeedProps {
  projects: Project[]
}

const activityIcons: Record<string, any> = {
  comment: MessageSquare,
  timelog: Clock,
  task: CheckSquare,
  project: Activity,
  default: Activity,
}

const activityColors: Record<string, string> = {
  comment: "text-blue-500",
  timelog: "text-green-500",
  task: "text-purple-500",
  project: "text-orange-500",
  default: "text-gray-500",
}

export function ActivityFeed({ projects }: ActivityFeedProps) {
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [activities, setActivities] = useState<ActivityItem[]>([])

  useEffect(() => {
    // Only load data on client side to prevent build-time API calls
    if (typeof window === 'undefined') return

    const loadActivities = async () => {
      try {
        const response = await fetch('/api/activity')
        if (response.ok) {
          const activitiesData = await response.json()
          setActivities(activitiesData)
        }
      } catch (error) {
        console.error('Error loading activities:', error)
      }
    }
    
    loadActivities()
  }, [])

  const filteredActivities = useMemo(() => {
    if (selectedProject === "all") {
      return activities
    }
    return activities.filter(activity => activity.projectId === selectedProject)
  }, [activities, selectedProject])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Activity Feed</span>
            </CardTitle>
            <CardDescription>Recent activity across your projects</CardDescription>
          </div>
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
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No recent activity found.</p>
          ) : (
            filteredActivities.map((activity) => {
              const Icon = activityIcons[activity.type] || activityIcons.default
              const iconColor = activityColors[activity.type] || activityColors.default

              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {activity.user ? (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={activity.user.image || ""} />
                        <AvatarFallback className="text-xs">
                          {activity.user.name?.[0] || activity.user.email[0]}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                        <Icon className={`h-4 w-4 ${iconColor}`} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Icon className={`h-4 w-4 ${iconColor}`} />
                      <p className="text-sm">
                        <span className="font-medium">
                          {activity.user ? activity.user.name || activity.user.email : "System"}
                        </span>{" "}
                        {activity.title}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      {activity.projectId && (
                        <Badge variant="outline" className="text-xs">
                          {projects.find(p => p.id === activity.projectId)?.name || 'Unknown Project'}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    {activity.message && activity.type === "comment" && (
                      <p className="text-sm text-muted-foreground line-clamp-2 bg-muted/50 rounded p-2">
                        "{activity.message}"
                      </p>
                    )}
                    {activity.message && activity.type === "timelog" && (
                      <p className="text-sm text-muted-foreground">{activity.message}</p>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
