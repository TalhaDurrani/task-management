"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface AddUserToWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  onUserAdded?: () => void
}

export function AddUserToWorkspaceDialog({
  open,
  onOpenChange,
  workspaceId,
  onUserAdded
}: AddUserToWorkspaceDialogProps) {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingUsers, setIsFetchingUsers] = useState(false)

  useEffect(() => {
    if (open) {
      loadAvailableUsers()
    }
  }, [open, workspaceId])

  const loadAvailableUsers = async () => {
    try {
      setIsFetchingUsers(true)
      // Get all users
      const allUsersResponse = await fetch('/api/users')
      if (!allUsersResponse.ok) throw new Error('Failed to fetch users')
      const allUsers = await allUsersResponse.json()

      // Get workspace users
      const workspaceUsersResponse = await fetch(`/api/workspaces/${workspaceId}/users`)
      if (!workspaceUsersResponse.ok) throw new Error('Failed to fetch workspace users')
      const workspaceUsers = await workspaceUsersResponse.json()

      // Filter out users already in workspace
      const workspaceUserIds = new Set(workspaceUsers.map((u: User) => u.id))
      const availableUsers = allUsers.filter((u: User) => !workspaceUserIds.has(u.id))
      
      setUsers(availableUsers)
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
    } finally {
      setIsFetchingUsers(false)
    }
  }

  const handleAddUser = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user')
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(`/api/workspaces/${workspaceId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add user')
      }

      toast.success('User added to workspace successfully')
      setSelectedUserId("")
      onOpenChange(false)
      onUserAdded?.()
    } catch (error) {
      console.error('Error adding user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add user')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add User to Workspace</DialogTitle>
          <DialogDescription>
            Select a user to add to this workspace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isFetchingUsers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No available users to add
            </p>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select User</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddUser}
            disabled={isLoading || !selectedUserId || isFetchingUsers}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add User
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
