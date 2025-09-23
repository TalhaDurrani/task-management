"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  PlayCircle,
  PauseCircle,
  SquareCircle,
  RotateCcw
} from "lucide-react"
import { toast } from "sonner"

interface Timer {
  id: string
  taskId: string
  userId: string
  description?: string
  startedAt: string
  endedAt?: string
  pausedAt?: string
  elapsedTime?: number
  isActive: boolean
  task: {
    id: string
    title: string
    description?: string
    status: string
    project: {
      id: string
      title: string
    }
  }
}

interface TimerWidgetProps {
  taskId: string
  onTimeLogged?: () => void
}

export function TimerWidget({ taskId, onTimeLogged }: TimerWidgetProps) {
  const [timer, setTimer] = useState<Timer | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [description, setDescription] = useState("")
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load active timer
  useEffect(() => {
    loadActiveTimer()
  }, [taskId])

  // Update elapsed time every second when timer is active
  useEffect(() => {
    if (timer?.isActive) {
      intervalRef.current = setInterval(() => {
        const now = new Date()
        const startTime = new Date(timer.startedAt)
        const elapsed = (now.getTime() - startTime.getTime()) / 1000
        setElapsedTime(Math.floor(elapsed))
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [timer?.isActive, timer?.startedAt])

  const loadActiveTimer = async () => {
    try {
      const response = await fetch(`/api/timer?taskId=${taskId}`)
      if (response.ok) {
        const data = await response.json()
        setTimer(data)
        if (data?.isActive) {
          const now = new Date()
          const startTime = new Date(data.startedAt)
          const elapsed = (now.getTime() - startTime.getTime()) / 1000
          setElapsedTime(Math.floor(elapsed))
        }
      }
    } catch (error) {
      console.error('Error loading timer:', error)
    }
  }

  const handleTimerAction = async (action: 'start' | 'stop' | 'pause' | 'resume') => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/timer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          action,
          description: description.trim() || undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update timer')
      }

      const data = await response.json()
      setTimer(data)
      
      if (action === 'start') {
        setElapsedTime(0)
        toast.success("Timer started!")
      } else if (action === 'stop') {
        toast.success(`Timer stopped! Logged ${Math.round((data.elapsedTime || 0) * 100) / 100} hours`)
        setDescription("")
        onTimeLogged?.()
      } else if (action === 'pause') {
        toast.success("Timer paused")
      } else if (action === 'resume') {
        toast.success("Timer resumed")
      }
    } catch (error) {
      console.error('Error updating timer:', error)
      toast.error(`Failed to ${action} timer: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatHours = (hours: number) => {
    return `${Math.round(hours * 100) / 100}h`
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Time Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timer Display */}
        <div className="text-center">
          <div className="text-3xl font-mono font-bold mb-2">
            {timer?.isActive ? formatTime(elapsedTime) : '00:00:00'}
          </div>
          {timer?.isActive && (
            <Badge variant="default" className="bg-green-100 text-green-800">
              Running
            </Badge>
          )}
          {timer && !timer.isActive && timer.pausedAt && (
            <Badge variant="secondary">
              Paused
            </Badge>
          )}
        </div>

        {/* Description Input */}
        <div className="space-y-2">
          <Label htmlFor="timer-description">Description (Optional)</Label>
          <Textarea
            id="timer-description"
            placeholder="What are you working on?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[60px]"
          />
        </div>

        {/* Timer Controls */}
        <div className="flex gap-2 justify-center">
          {!timer?.isActive && !timer?.pausedAt && (
            <Button
              onClick={() => handleTimerAction('start')}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <PlayCircle className="h-4 w-4" />
              Start
            </Button>
          )}

          {timer?.isActive && (
            <>
              <Button
                onClick={() => handleTimerAction('pause')}
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <PauseCircle className="h-4 w-4" />
                Pause
              </Button>
              <Button
                onClick={() => handleTimerAction('stop')}
                disabled={isLoading}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <SquareCircle className="h-4 w-4" />
                Stop
              </Button>
            </>
          )}

          {timer?.pausedAt && !timer?.isActive && (
            <>
              <Button
                onClick={() => handleTimerAction('resume')}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <PlayCircle className="h-4 w-4" />
                Resume
              </Button>
              <Button
                onClick={() => handleTimerAction('stop')}
                disabled={isLoading}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <SquareCircle className="h-4 w-4" />
                Stop
              </Button>
            </>
          )}
        </div>

        {/* Timer Info */}
        {timer && (
          <div className="text-sm text-muted-foreground space-y-1">
            <div>Started: {new Date(timer.startedAt).toLocaleString()}</div>
            {timer.description && (
              <div>Description: {timer.description}</div>
            )}
            {timer.elapsedTime && (
              <div>Total time: {formatHours(timer.elapsedTime)}</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
