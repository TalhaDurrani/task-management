import React, { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { TaskAssigneeSelect } from './task-assignee-select'

// Task type definitions
type TaskStatus = 'todo' | 'in-progress' | 'done'
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
type TaskType = 'bug' | 'feature' | 'story' | 'epic' | 'task' | 'subtask'

interface User {
  id: string
  name: string
  email: string
}

interface TaskDetailDialogProps {
  task: {
    id: string
    title: string
    description?: string
    status: TaskStatus
    priority: TaskPriority
    type: TaskType
    assignees?: User[]
    createdBy?: User
    createdAt: Date
    dueDate?: Date
  }
  isOpen: boolean
  onClose: () => void
  onUpdate: (updatedTask: Partial<TaskDetailDialogProps['task']>) => void
}

export const TaskDetailDialog: React.FC<TaskDetailDialogProps> = ({
  task,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [editableTask, setEditableTask] = useState(task)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    setEditableTask(task)
  }, [task])

  const handleSave = () => {
    onUpdate(editableTask)
    setIsEditing(false)
  }

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'todo': return 'bg-gray-200 text-gray-800'
      case 'in-progress': return 'bg-blue-200 text-blue-800'
      case 'done': return 'bg-green-200 text-green-800'
    }
  }

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'LOW': return 'bg-green-100 text-green-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'CRITICAL': return 'bg-red-100 text-red-800'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? (
              <Input 
                value={editableTask.title}
                onChange={(e) => setEditableTask({...editableTask, title: e.target.value})}
                placeholder="Task Title"
              />
            ) : (
              task.title
            )}
          </DialogTitle>
          <div className="flex space-x-2 mt-2">
            <Badge 
              className={`${getStatusColor(editableTask.status)} capitalize`}
            >
              {isEditing ? (
                <Select 
                  value={editableTask.status}
                  onValueChange={(value: TaskStatus) => 
                    setEditableTask({...editableTask, status: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">Todo</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                editableTask.status
              )}
            </Badge>
            <Badge 
              className={`${getPriorityColor(editableTask.priority)} capitalize`}
            >
              {isEditing ? (
                <Select 
                  value={editableTask.priority}
                  onValueChange={(value: TaskPriority) => 
                    setEditableTask({...editableTask, priority: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                editableTask.priority
              )}
            </Badge>
            <Badge className="bg-purple-100 text-purple-800 capitalize">
              {isEditing ? (
                <Select 
                  value={editableTask.type}
                  onValueChange={(value: TaskType) => 
                    setEditableTask({...editableTask, type: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="feature">Feature</SelectItem>
                    <SelectItem value="story">Story</SelectItem>
                    <SelectItem value="epic">Epic</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="subtask">Subtask</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                editableTask.type
              )}
            </Badge>
          </div>
        </DialogHeader>

        <DialogDescription>
          {isEditing ? (
            <Textarea 
              value={editableTask.description || ''}
              onChange={(e) => setEditableTask({...editableTask, description: e.target.value})}
              placeholder="Task Description"
              className="mt-2"
            />
          ) : (
            editableTask.description || 'No description provided'
          )}
        </DialogDescription>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <h3 className="font-semibold">Assignees</h3>
            {isEditing ? (
              <TaskAssigneeSelect 
                selectedUsers={editableTask.assignees || []}
                onSelectedUsersChange={(users) => 
                  setEditableTask({...editableTask, assignees: users})
                }
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {editableTask.assignees?.map(user => (
                  <Badge key={user.id} variant="secondary">
                    {user.name}
                  </Badge>
                ))}
                {(!editableTask.assignees || editableTask.assignees.length === 0) && (
                  <span className="text-gray-500">Unassigned</span>
                )}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold">Created By</h3>
            {editableTask.createdBy ? (
              <Badge variant="outline">{editableTask.createdBy.name}</Badge>
            ) : (
              <span className="text-gray-500">Unknown</span>
            )}
          </div>
        </div>

        <div className="flex justify-between mt-4">
          <div>
            <p>Created: {new Date(editableTask.createdAt).toLocaleString()}</p>
            {editableTask.dueDate && (
              <p>Due: {new Date(editableTask.dueDate).toLocaleString()}</p>
            )}
          </div>
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save</Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                Edit Task
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
