"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  User,
  FileText
} from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface TimeLog {
  id: string
  taskId: string
  userId: string
  hoursSpent: number
  description?: string
  logDate: string
  createdAt: string
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
  user: {
    id: string
    name: string
    email: string
  }
}

interface TimeLogsListProps {
  taskId: string
  onTimeLogAdded?: () => void
}

export function TimeLogsList({ taskId, onTimeLogAdded }: TimeLogsListProps) {
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingLog, setIsAddingLog] = useState(false)
  const [editingLog, setEditingLog] = useState<TimeLog | null>(null)
  const [deletingLog, setDeletingLog] = useState<TimeLog | null>(null)

  // Form state
  const [hoursSpent, setHoursSpent] = useState("")
  const [description, setDescription] = useState("")
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    loadTimeLogs()
  }, [taskId])

  const loadTimeLogs = async () => {
    try {
      const response = await fetch(`/api/time-logs?taskId=${taskId}`)
      if (response.ok) {
        const data = await response.json()
        setTimeLogs(data)
      }
    } catch (error) {
      console.error('Error loading time logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddTimeLog = async () => {
    if (!hoursSpent || parseFloat(hoursSpent) <= 0) {
      toast.error("Please enter a valid number of hours")
      return
    }

    try {
      const response = await fetch('/api/time-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          hoursSpent: parseFloat(hoursSpent),
          description: description.trim() || undefined,
          logDate: new Date(logDate).toISOString()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add time log')
      }

      toast.success("Time log added successfully!")
      setHoursSpent("")
      setDescription("")
      setLogDate(new Date().toISOString().split('T')[0])
      setIsAddingLog(false)
      loadTimeLogs()
      onTimeLogAdded?.()
    } catch (error) {
      console.error('Error adding time log:', error)
      toast.error(`Failed to add time log: ${error.message}`)
    }
  }

  const handleEditTimeLog = async (log: TimeLog) => {
    if (!hoursSpent || parseFloat(hoursSpent) <= 0) {
      toast.error("Please enter a valid number of hours")
      return
    }

    try {
      const response = await fetch(`/api/time-logs/${log.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hoursSpent: parseFloat(hoursSpent),
          description: description.trim() || undefined,
          logDate: new Date(logDate).toISOString()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update time log')
      }

      toast.success("Time log updated successfully!")
      setEditingLog(null)
      setHoursSpent("")
      setDescription("")
      setLogDate(new Date().toISOString().split('T')[0])
      loadTimeLogs()
    } catch (error) {
      console.error('Error updating time log:', error)
      toast.error(`Failed to update time log: ${error.message}`)
    }
  }

  const handleDeleteTimeLog = async (log: TimeLog) => {
    try {
      const response = await fetch(`/api/time-logs/${log.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete time log')
      }

      toast.success("Time log deleted successfully!")
      setDeletingLog(null)
      loadTimeLogs()
    } catch (error) {
      console.error('Error deleting time log:', error)
      toast.error(`Failed to delete time log: ${error.message}`)
    }
  }

  const openEditDialog = (log: TimeLog) => {
    setEditingLog(log)
    setHoursSpent(log.hoursSpent.toString())
    setDescription(log.description || "")
    setLogDate(new Date(log.logDate).toISOString().split('T')[0])
  }

  const resetForm = () => {
    setHoursSpent("")
    setDescription("")
    setLogDate(new Date().toISOString().split('T')[0])
    setEditingLog(null)
    setIsAddingLog(false)
  }

  const totalHours = timeLogs.reduce((sum, log) => sum + log.hoursSpent, 0)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading time logs...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Logs
            <Badge variant="secondary">{timeLogs.length} entries</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Total: {Math.round(totalHours * 100) / 100}h
            </span>
            <Dialog open={isAddingLog} onOpenChange={setIsAddingLog}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Log
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Time Log</DialogTitle>
                  <DialogDescription>
                    Record time spent on this task
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="hours">Hours Spent</Label>
                    <Input
                      id="hours"
                      type="number"
                      step="0.25"
                      min="0"
                      placeholder="2.5"
                      value={hoursSpent}
                      onChange={(e) => setHoursSpent(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={logDate}
                      onChange={(e) => setLogDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="What did you work on?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddTimeLog}>
                      Add Time Log
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {timeLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No time logs yet</p>
            <p className="text-sm">Start tracking time to see entries here</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Logged By</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {new Date(log.logDate).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {Math.round(log.hoursSpent * 100) / 100}h
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.description ? (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-[200px]">
                            {log.description}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No description</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{log.user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(log)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingLog(log)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingLog} onOpenChange={(open) => !open && resetForm()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Time Log</DialogTitle>
              <DialogDescription>
                Update the time log entry
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-hours">Hours Spent</Label>
                <Input
                  id="edit-hours"
                  type="number"
                  step="0.25"
                  min="0"
                  placeholder="2.5"
                  value={hoursSpent}
                  onChange={(e) => setHoursSpent(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description (Optional)</Label>
                <Textarea
                  id="edit-description"
                  placeholder="What did you work on?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button onClick={() => editingLog && handleEditTimeLog(editingLog)}>
                  Update Time Log
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={!!deletingLog} onOpenChange={(open) => !open && setDeletingLog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Time Log</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this time log? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {deletingLog && (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <div className="font-medium">{deletingLog.hoursSpent}h on {new Date(deletingLog.logDate).toLocaleDateString()}</div>
                  {deletingLog.description && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {deletingLog.description}
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDeletingLog(null)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={() => handleDeleteTimeLog(deletingLog)}>
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
