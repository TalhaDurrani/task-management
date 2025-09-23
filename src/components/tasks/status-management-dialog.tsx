"use client"

import { useState } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { statusService } from "@/services/statusService"
import { TaskStatusObject, StatusCategory } from "@/types"
import { Badge } from "@/components/ui/badge"

const STATUS_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint
  '#F3B562', // Warm Yellow
  '#A569BD', // Purple
]

const STATUS_CATEGORIES: { value: StatusCategory; label: string }[] = [
  { value: 'not-started', label: 'Not Started' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' }
]

interface StatusManagementDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusesUpdated?: (statuses: TaskStatusObject[]) => void
}

export function StatusManagementDialog({ 
  projectId, 
  open, 
  onOpenChange,
  onStatusesUpdated 
}: StatusManagementDialogProps) {
  const [statuses, setStatuses] = useState<TaskStatusObject[]>([])
  const [newStatus, setNewStatus] = useState({
    name: '',
    color: STATUS_COLORS[0],
    category: 'not-started' as StatusCategory
  })

  const loadStatuses = async () => {
    const projectStatuses = await statusService.getStatusesByProject(projectId)
    setStatuses(projectStatuses)
  }

  const handleCreateStatus = async () => {
    if (!newStatus.name.trim()) return

    const createdStatus = await statusService.createStatus({
      ...newStatus,
      projectId
    })

    setStatuses([...statuses, createdStatus])
    setNewStatus({
      name: '',
      color: STATUS_COLORS[0],
      category: 'not-started'
    })
    onStatusesUpdated?.(statuses)
  }

  const handleDeleteStatus = async (statusId: string) => {
    await statusService.deleteStatus(statusId)
    const updatedStatuses = statuses.filter(s => s.id !== statusId)
    setStatuses(updatedStatuses)
    onStatusesUpdated?.(updatedStatuses)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Project Statuses</DialogTitle>
          <DialogDescription>
            Create, edit, and delete statuses for this project
          </DialogDescription>
        </DialogHeader>

        {/* Create New Status */}
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Status Name</Label>
              <Input 
                value={newStatus.name}
                onChange={(e) => setNewStatus({
                  ...newStatus, 
                  name: e.target.value
                })}
                placeholder="Enter status name"
              />
            </div>
            <div>
              <Label>Color</Label>
              <Select 
                value={newStatus.color}
                onValueChange={(color) => setNewStatus({
                  ...newStatus, 
                  color
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Color" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_COLORS.map(color => (
                    <SelectItem key={color} value={color}>
                      <div 
                        className="w-full h-6 rounded" 
                        style={{ backgroundColor: color }}
                      />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select 
                value={newStatus.category}
                onValueChange={(category) => setNewStatus({
                  ...newStatus, 
                  category: category as StatusCategory
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleCreateStatus}>
            Create Status
          </Button>
        </div>

        {/* Existing Statuses */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Existing Statuses</h3>
          <div className="flex flex-wrap gap-2">
            {statuses.map(status => (
              <Badge 
                key={status.id} 
                variant="outline"
                style={{ 
                  backgroundColor: status.color, 
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {status.name}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4"
                  onClick={() => handleDeleteStatus(status.id)}
                >
                  ×
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

