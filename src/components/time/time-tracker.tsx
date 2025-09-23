"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  Calendar,
  TrendingUp,
  Target,
  Timer,
  PlayCircle,
  PauseCircle,
  StopCircle,
  MoreHorizontal,
  Edit,
  Trash2
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface TimeEntry {
  id: string
  taskId: string
  taskTitle: string
  projectName: string
  description?: string
  startTime: Date
  endTime?: Date
  duration: number // in minutes
  isRunning: boolean
  assignee: {
    id: string
    name: string
    image?: string
  }
}

interface TimeTrackerProps {
  entries?: TimeEntry[]
  onStartTimer?: (taskId: string) => void
  onStopTimer?: (entryId: string) => void
  onPauseTimer?: (entryId: string) => void
  onResumeTimer?: (entryId: string) => void
  onEditEntry?: (entry: TimeEntry) => void
  onDeleteEntry?: (entryId: string) => void
}

const mockTimeEntries: TimeEntry[] = [
  {
    id: "1",
    taskId: "task-1",
    taskTitle: "Implement user authentication",
    projectName: "TaskFlow App",
    description: "Working on OAuth integration",
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    duration: 120,
    isRunning: true,
    assignee: {
      id: "1",
      name: "John Doe",
      image: ""
    }
  },
  {
    id: "2",
    taskId: "task-2", 
    taskTitle: "Design dashboard layout",
    projectName: "TaskFlow App",
    description: "Creating responsive dashboard components",
    startTime: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    endTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    duration: 180,
    isRunning: false,
    assignee: {
      id: "2",
      name: "Jane Smith",
      image: ""
    }
  },
  {
    id: "3",
    taskId: "task-3",
    taskTitle: "Write API documentation",
    projectName: "TaskFlow App", 
    description: "Documenting REST API endpoints",
    startTime: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    endTime: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    duration: 180,
    isRunning: false,
    assignee: {
      id: "1",
      name: "John Doe",
      image: ""
    }
  }
]

export function TimeTracker({ 
  entries = mockTimeEntries,
  onStartTimer,
  onStopTimer,
  onPauseTimer,
  onResumeTimer,
  onEditEntry,
  onDeleteEntry
}: TimeTrackerProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [runningEntry, setRunningEntry] = useState<TimeEntry | null>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const running = entries.find(entry => entry.isRunning)
    setRunningEntry(running || null)
  }, [entries])

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  const getCurrentDuration = (entry: TimeEntry) => {
    if (!entry.isRunning) return entry.duration
    
    const startTime = entry.startTime.getTime()
    const now = currentTime.getTime()
    const elapsedMinutes = Math.floor((now - startTime) / (1000 * 60))
    
    return entry.duration + elapsedMinutes
  }

  const getTotalTimeToday = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return entries
      .filter(entry => {
        const entryDate = new Date(entry.startTime)
        entryDate.setHours(0, 0, 0, 0)
        return entryDate.getTime() === today.getTime()
      })
      .reduce((total, entry) => total + getCurrentDuration(entry), 0)
  }

  const getWeeklyGoal = () => 40 * 60 // 40 hours in minutes
  const getDailyGoal = () => 8 * 60 // 8 hours in minutes

  const totalTimeToday = getTotalTimeToday()
  const dailyGoal = getDailyGoal()
  const dailyProgress = (totalTimeToday / dailyGoal) * 100

  return (
    <div className="space-y-6">
      {/* Header with Current Timer */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Time Tracking</h2>
          <p className="text-muted-foreground">
            Track time spent on tasks and projects
          </p>
        </div>
        
        {runningEntry && (
          <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Currently tracking:</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-mono font-bold">
                    {formatDuration(getCurrentDuration(runningEntry))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {runningEntry.taskTitle}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Daily Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(totalTimeToday)}</div>
            <p className="text-xs text-muted-foreground">
              {formatDuration(dailyGoal - totalTimeToday)} remaining to goal
            </p>
            <Progress value={Math.min(dailyProgress, 100)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(entries.reduce((total, entry) => total + getCurrentDuration(entry), 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {entries.length} time entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productivity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(dailyProgress)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Daily goal completion
            </p>
            <Progress value={Math.min(dailyProgress, 100)} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Time Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {entries.map((entry) => {
              const currentDuration = getCurrentDuration(entry)
              const isCurrentlyRunning = entry.isRunning

              return (
                <div
                  key={entry.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-all duration-200",
                    isCurrentlyRunning && "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
                  )}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={entry.assignee.image || ""} alt={entry.assignee.name} />
                      <AvatarFallback className="text-xs">
                        {entry.assignee.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-sm truncate">
                          {entry.taskTitle}
                        </h4>
                        {isCurrentlyRunning && (
                          <Badge variant="outline" className="text-xs border-green-200 text-green-800">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                            Running
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>{entry.projectName}</span>
                        {entry.description && (
                          <>
                            <span>•</span>
                            <span className="truncate">{entry.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="font-mono font-bold text-lg">
                        {formatDuration(currentDuration)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {entry.startTime.toLocaleTimeString()}
                        {entry.endTime && ` - ${entry.endTime.toLocaleTimeString()}`}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      {isCurrentlyRunning ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onStopTimer?.(entry.id)}
                          className="h-8 w-8 p-0"
                        >
                          <StopCircle className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => onStartTimer?.(entry.taskId)}
                          className="h-8 w-8 p-0"
                        >
                          <PlayCircle className="h-4 w-4" />
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEditEntry?.(entry)}>
                            <Edit className="mr-2 h-3 w-3" />
                            Edit Entry
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDeleteEntry?.(entry.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-3 w-3" />
                            Delete Entry
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
