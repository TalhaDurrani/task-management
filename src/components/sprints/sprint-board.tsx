"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Plus, 
  Calendar, 
  Clock, 
  Target,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Play,
  Pause,
  RotateCcw
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Sprint {
  id: string
  name: string
  goal: string
  status: "planning" | "active" | "completed"
  startDate: Date
  endDate: Date
  totalStoryPoints: number
  completedStoryPoints: number
  totalTasks: number
  completedTasks: number
  teamMembers: Array<{
    id: string
    name: string
    image?: string
  }>
}

interface SprintBoardProps {
  sprints: Sprint[]
  onCreateSprint?: () => void
  onStartSprint?: (sprintId: string) => void
  onCompleteSprint?: (sprintId: string) => void
}

const mockSprints: Sprint[] = [
  {
    id: "1",
    name: "Sprint 1 - User Authentication",
    goal: "Implement complete user authentication system with OAuth and email verification",
    status: "active",
    startDate: new Date("2024-01-15"),
    endDate: new Date("2024-01-29"),
    totalStoryPoints: 34,
    completedStoryPoints: 18,
    totalTasks: 12,
    completedTasks: 6,
    teamMembers: [
      { id: "1", name: "John Doe", image: "" },
      { id: "2", name: "Jane Smith", image: "" },
      { id: "3", name: "Mike Johnson", image: "" }
    ]
  },
  {
    id: "2", 
    name: "Sprint 2 - Dashboard & Analytics",
    goal: "Build comprehensive dashboard with real-time analytics and reporting",
    status: "planning",
    startDate: new Date("2024-01-30"),
    endDate: new Date("2024-02-13"),
    totalStoryPoints: 28,
    completedStoryPoints: 0,
    totalTasks: 8,
    completedTasks: 0,
    teamMembers: [
      { id: "1", name: "John Doe", image: "" },
      { id: "2", name: "Jane Smith", image: "" }
    ]
  },
  {
    id: "3",
    name: "Sprint 0 - Project Setup",
    goal: "Initial project setup, CI/CD pipeline, and basic infrastructure",
    status: "completed",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-01-14"),
    totalStoryPoints: 16,
    completedStoryPoints: 16,
    totalTasks: 6,
    completedTasks: 6,
    teamMembers: [
      { id: "1", name: "John Doe", image: "" },
      { id: "2", name: "Jane Smith", image: "" }
    ]
  }
]

export function SprintBoard({ 
  sprints = mockSprints,
  onCreateSprint,
  onStartSprint,
  onCompleteSprint
}: SprintBoardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200"
      case "planning":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200"
      case "completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Play className="h-3 w-3" />
      case "planning":
        return <Circle className="h-3 w-3" />
      case "completed":
        return <CheckCircle2 className="h-3 w-3" />
      default:
        return <Circle className="h-3 w-3" />
    }
  }

  const getDaysRemaining = (endDate: Date) => {
    const now = new Date()
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getBurndownProgress = (sprint: Sprint) => {
    if (sprint.status === "completed") return 100
    if (sprint.status === "planning") return 0
    
    const totalDays = Math.ceil((sprint.endDate.getTime() - sprint.startDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysElapsed = Math.ceil((new Date().getTime() - sprint.startDate.getTime()) / (1000 * 60 * 60 * 24))
    const expectedProgress = Math.min((daysElapsed / totalDays) * 100, 100)
    
    return Math.max(expectedProgress, 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sprint Management</h2>
          <p className="text-muted-foreground">
            Plan, track, and manage your development sprints
          </p>
        </div>
        <Button onClick={onCreateSprint}>
          <Plus className="mr-2 h-4 w-4" />
          Create Sprint
        </Button>
      </div>

      {/* Sprint Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sprints.map((sprint) => {
          const daysRemaining = getDaysRemaining(sprint.endDate)
          const isOverdue = daysRemaining < 0 && sprint.status === "active"
          const isDueSoon = daysRemaining <= 3 && daysRemaining >= 0 && sprint.status === "active"
          const storyPointProgress = sprint.totalStoryPoints > 0 
            ? (sprint.completedStoryPoints / sprint.totalStoryPoints) * 100 
            : 0
          const taskProgress = sprint.totalTasks > 0 
            ? (sprint.completedTasks / sprint.totalTasks) * 100 
            : 0
          const burndownProgress = getBurndownProgress(sprint)

          return (
            <Card 
              key={sprint.id}
              className={cn(
                "transition-all duration-200 hover:shadow-md",
                isOverdue && "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20",
                isDueSoon && !isOverdue && "border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20"
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{sprint.name}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {sprint.goal}
                    </p>
                  </div>
                  <Badge className={cn("text-xs", getStatusColor(sprint.status))}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(sprint.status)}
                      <span className="capitalize">{sprint.status}</span>
                    </div>
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Timeline */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Timeline</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {isOverdue && <AlertTriangle className="h-3 w-3 text-red-500" />}
                      <span className={cn(
                        "text-xs font-medium",
                        isOverdue && "text-red-600",
                        isDueSoon && !isOverdue && "text-orange-600"
                      )}>
                        {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : 
                         daysRemaining === 0 ? "Ends today" :
                         `${daysRemaining} days left`}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {sprint.startDate.toLocaleDateString()} - {sprint.endDate.toLocaleDateString()}
                  </div>
                </div>

                {/* Story Points Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <Target className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Story Points</span>
                    </div>
                    <span className="text-xs font-medium">
                      {sprint.completedStoryPoints}/{sprint.totalStoryPoints}
                    </span>
                  </div>
                  <Progress value={storyPointProgress} className="h-2" />
                </div>

                {/* Task Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Tasks</span>
                    </div>
                    <span className="text-xs font-medium">
                      {sprint.completedTasks}/{sprint.totalTasks}
                    </span>
                  </div>
                  <Progress value={taskProgress} className="h-2" />
                </div>

                {/* Burndown Chart Placeholder */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Burndown</span>
                    </div>
                    <span className="text-xs font-medium">
                      {Math.round(burndownProgress)}%
                    </span>
                  </div>
                  <Progress value={burndownProgress} className="h-2" />
                </div>

                {/* Team Members */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-1 text-sm">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Team</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {sprint.teamMembers.slice(0, 3).map((member) => (
                      <Avatar key={member.id} className="h-6 w-6">
                        <AvatarImage src={member.image || ""} alt={member.name} />
                        <AvatarFallback className="text-xs">
                          {member.name[0]}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {sprint.teamMembers.length > 3 && (
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs font-medium">
                          +{sprint.teamMembers.length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  {sprint.status === "planning" && (
                    <Button 
                      size="sm" 
                      onClick={() => onStartSprint?.(sprint.id)}
                      className="flex-1"
                    >
                      <Play className="mr-1 h-3 w-3" />
                      Start Sprint
                    </Button>
                  )}
                  {sprint.status === "active" && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onCompleteSprint?.(sprint.id)}
                      className="flex-1"
                    >
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Complete
                    </Button>
                  )}
                  {sprint.status === "completed" && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1"
                    >
                      <RotateCcw className="mr-1 h-3 w-3" />
                      View Report
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
