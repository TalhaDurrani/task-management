"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Plus, 
  Target,
  TrendingUp,
  Calendar,
  Users,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Star,
  Flag,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface KeyResult {
  id: string
  title: string
  description: string
  target: number
  current: number
  unit: string
  status: "not-started" | "in-progress" | "completed"
  assignee: {
    id: string
    name: string
    image?: string
  }
}

interface Goal {
  id: string
  title: string
  description: string
  type: "company" | "team" | "personal"
  status: "not-started" | "in-progress" | "completed" | "paused"
  priority: "low" | "medium" | "high" | "critical"
  startDate: Date
  endDate: Date
  keyResults: KeyResult[]
  owner: {
    id: string
    name: string
    image?: string
  }
  teamMembers: Array<{
    id: string
    name: string
    image?: string
  }>
  progress: number
}

interface GoalsBoardProps {
  goals?: Goal[]
  onCreateGoal?: () => void
  onEditGoal?: (goal: Goal) => void
  onDeleteGoal?: (goalId: string) => void
  onUpdateKeyResult?: (goalId: string, keyResultId: string, value: number) => void
}

const mockGoals: Goal[] = [
  {
    id: "1",
    title: "Increase User Engagement",
    description: "Improve user engagement metrics across all platforms by implementing new features and optimizing existing ones",
    type: "company",
    status: "in-progress",
    priority: "high",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-03-31"),
    progress: 65,
    owner: {
      id: "1",
      name: "John Doe",
      image: ""
    },
    teamMembers: [
      { id: "1", name: "John Doe", image: "" },
      { id: "2", name: "Jane Smith", image: "" },
      { id: "3", name: "Mike Johnson", image: "" }
    ],
    keyResults: [
      {
        id: "kr1",
        title: "Increase Daily Active Users",
        description: "Reach 10,000 DAU by end of Q1",
        target: 10000,
        current: 7500,
        unit: "users",
        status: "in-progress",
        assignee: { id: "1", name: "John Doe", image: "" }
      },
      {
        id: "kr2", 
        title: "Improve Session Duration",
        description: "Average session duration of 15+ minutes",
        target: 15,
        current: 12,
        unit: "minutes",
        status: "in-progress",
        assignee: { id: "2", name: "Jane Smith", image: "" }
      },
      {
        id: "kr3",
        title: "Reduce Churn Rate",
        description: "Keep monthly churn rate below 5%",
        target: 5,
        current: 3,
        unit: "%",
        status: "completed",
        assignee: { id: "3", name: "Mike Johnson", image: "" }
      }
    ]
  },
  {
    id: "2",
    title: "Launch Mobile App",
    description: "Successfully launch the mobile application for iOS and Android platforms",
    type: "team",
    status: "in-progress", 
    priority: "critical",
    startDate: new Date("2024-02-01"),
    endDate: new Date("2024-04-30"),
    progress: 40,
    owner: {
      id: "2",
      name: "Jane Smith",
      image: ""
    },
    teamMembers: [
      { id: "2", name: "Jane Smith", image: "" },
      { id: "4", name: "Sarah Wilson", image: "" }
    ],
    keyResults: [
      {
        id: "kr4",
        title: "Complete iOS Development",
        description: "Finish iOS app development and testing",
        target: 100,
        current: 80,
        unit: "%",
        status: "in-progress",
        assignee: { id: "2", name: "Jane Smith", image: "" }
      },
      {
        id: "kr5",
        title: "Complete Android Development", 
        description: "Finish Android app development and testing",
        target: 100,
        current: 60,
        unit: "%",
        status: "in-progress",
        assignee: { id: "4", name: "Sarah Wilson", image: "" }
      },
      {
        id: "kr6",
        title: "App Store Approval",
        description: "Get approval from both App Store and Google Play",
        target: 1,
        current: 0,
        unit: "approvals",
        status: "not-started",
        assignee: { id: "2", name: "Jane Smith", image: "" }
      }
    ]
  },
  {
    id: "3",
    title: "Improve Code Quality",
    description: "Enhance code quality metrics and reduce technical debt",
    type: "personal",
    status: "completed",
    priority: "medium",
    startDate: new Date("2024-01-15"),
    endDate: new Date("2024-02-15"),
    progress: 100,
    owner: {
      id: "3",
      name: "Mike Johnson",
      image: ""
    },
    teamMembers: [
      { id: "3", name: "Mike Johnson", image: "" }
    ],
    keyResults: [
      {
        id: "kr7",
        title: "Increase Test Coverage",
        description: "Achieve 90% test coverage across all modules",
        target: 90,
        current: 92,
        unit: "%",
        status: "completed",
        assignee: { id: "3", name: "Mike Johnson", image: "" }
      },
      {
        id: "kr8",
        title: "Reduce Code Duplication",
        description: "Reduce code duplication to less than 5%",
        target: 5,
        current: 3,
        unit: "%",
        status: "completed",
        assignee: { id: "3", name: "Mike Johnson", image: "" }
      }
    ]
  }
]

export function GoalsBoard({ 
  goals = mockGoals,
  onCreateGoal,
  onEditGoal,
  onDeleteGoal,
  onUpdateKeyResult
}: GoalsBoardProps) {
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200"
      case "in-progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200"
      case "paused":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "company":
        return <Star className="h-4 w-4" />
      case "team":
        return <Users className="h-4 w-4" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  const getDaysRemaining = (endDate: Date) => {
    const now = new Date()
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getOverallProgress = (goal: Goal) => {
    if (goal.keyResults.length === 0) return goal.progress
    
    const totalProgress = goal.keyResults.reduce((sum, kr) => {
      const krProgress = (kr.current / kr.target) * 100
      return sum + Math.min(krProgress, 100)
    }, 0)
    
    return totalProgress / goal.keyResults.length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Goals & OKRs</h2>
          <p className="text-muted-foreground">
            Set and track company, team, and personal objectives
          </p>
        </div>
        <Button onClick={onCreateGoal}>
          <Plus className="mr-2 h-4 w-4" />
          Create Goal
        </Button>
      </div>

      {/* Goals Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {goals.map((goal) => {
          const daysRemaining = getDaysRemaining(goal.endDate)
          const isOverdue = daysRemaining < 0 && goal.status !== "completed"
          const isDueSoon = daysRemaining <= 7 && daysRemaining >= 0 && goal.status !== "completed"
          const overallProgress = getOverallProgress(goal)

          return (
            <Card 
              key={goal.id}
              className={cn(
                "transition-all duration-200 hover:shadow-md cursor-pointer",
                isOverdue && "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20",
                isDueSoon && !isOverdue && "border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20"
              )}
              onClick={() => setSelectedGoal(goal)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(goal.type)}
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      <div className={cn("w-2 h-2 rounded-full", getPriorityColor(goal.priority))} />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {goal.description}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditGoal?.(goal)}>
                        <Edit className="mr-2 h-3 w-3" />
                        Edit Goal
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDeleteGoal?.(goal.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-3 w-3" />
                        Delete Goal
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Status and Timeline */}
                <div className="flex items-center justify-between">
                  <Badge className={cn("text-xs", getStatusColor(goal.status))}>
                    <div className="flex items-center space-x-1">
                      {goal.status === "completed" && <CheckCircle2 className="h-3 w-3" />}
                      {goal.status === "in-progress" && <Circle className="h-3 w-3" />}
                      {goal.status === "paused" && <AlertTriangle className="h-3 w-3" />}
                      <span className="capitalize">{goal.status.replace("-", " ")}</span>
                    </div>
                  </Badge>
                  
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : 
                       daysRemaining === 0 ? "Ends today" :
                       `${daysRemaining} days left`}
                    </span>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Overall Progress</span>
                    <span className="font-medium">{Math.round(overallProgress)}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-2" />
                </div>

                {/* Key Results */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Key Results</span>
                    <span className="font-medium">
                      {goal.keyResults.filter(kr => kr.status === "completed").length}/{goal.keyResults.length}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {goal.keyResults.slice(0, 2).map((kr) => {
                      const krProgress = (kr.current / kr.target) * 100
                      return (
                        <div key={kr.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="truncate flex-1 mr-2">{kr.title}</span>
                            <span className="font-medium">
                              {kr.current}/{kr.target} {kr.unit}
                            </span>
                          </div>
                          <Progress value={Math.min(krProgress, 100)} className="h-1" />
                        </div>
                      )
                    })}
                    {goal.keyResults.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{goal.keyResults.length - 2} more key results
                      </div>
                    )}
                  </div>
                </div>

                {/* Team */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Team</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {goal.teamMembers.slice(0, 3).map((member) => (
                      <Avatar key={member.id} className="h-5 w-5">
                        <AvatarImage src={member.image || ""} alt={member.name} />
                        <AvatarFallback className="text-xs">
                          {member.name[0]}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {goal.teamMembers.length > 3 && (
                      <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs font-medium">
                          +{goal.teamMembers.length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Goal Detail Modal would go here */}
      {selectedGoal && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{selectedGoal.title}</CardTitle>
                <p className="text-muted-foreground">{selectedGoal.description}</p>
              </div>
              <Button variant="outline" onClick={() => setSelectedGoal(null)}>
                <Eye className="mr-2 h-4 w-4" />
                Close Details
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedGoal.keyResults.map((kr) => {
                const krProgress = (kr.current / kr.target) * 100
                return (
                  <div key={kr.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{kr.title}</h4>
                        <p className="text-sm text-muted-foreground">{kr.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold">
                          {kr.current}/{kr.target} {kr.unit}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {Math.round(krProgress)}%
                        </div>
                      </div>
                    </div>
                    <Progress value={Math.min(krProgress, 100)} className="h-2" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
