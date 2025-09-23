"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Users, Building2, FolderOpen } from "lucide-react"
import { toast } from "sonner"

interface User {
  id: string
  name: string
  email: string
  role: string
  organizationId: string | null
  workspaceId: string | null
  organization?: {
    id: string
    name: string
  }
  workspace?: {
    id: string
    name: string
  }
}

interface Organization {
  id: string
  name: string
}

interface Workspace {
  id: string
  name: string
  organizationId: string
  organization: {
    id: string
    name: string
  }
}

export function UserWorkspaceAssignment() {
  const [users, setUsers] = useState<User[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [assigning, setAssigning] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load users, organizations, and workspaces
      const [usersRes, orgsRes, workspacesRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/organizations'),
        fetch('/api/workspaces')
      ])

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData)
      }

      if (orgsRes.ok) {
        const orgsData = await orgsRes.json()
        setOrganizations(orgsData)
      }

      if (workspacesRes.ok) {
        const workspacesData = await workspacesRes.json()
        setWorkspaces(workspacesData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssignUser = async (userId: string, workspaceId: string) => {
    setAssigning(userId)
    try {
      const response = await fetch(`/api/users/${userId}/assign-workspace`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workspaceId }),
      })

      if (response.ok) {
        toast.success('User assigned to workspace successfully')
        loadData() // Reload data
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to assign user')
      }
    } catch (error) {
      console.error('Error assigning user:', error)
      toast.error('Failed to assign user')
    } finally {
      setAssigning(null)
    }
  }

  const unassignedUsers = users.filter(user => !user.workspaceId)
  const assignedUsers = users.filter(user => user.workspaceId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">User Workspace Assignment</h2>
        <p className="text-muted-foreground">
          Assign users to workspaces so they can create and manage projects.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Unassigned Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Unassigned Users ({unassignedUsers.length})
            </CardTitle>
            <CardDescription>
              Users who need to be assigned to a workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {unassignedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <Badge variant="outline" className="mt-1">
                      {user.role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select onValueChange={(workspaceId) => handleAssignUser(user.id, workspaceId)}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select workspace" />
                      </SelectTrigger>
                      <SelectContent>
                        {workspaces.map((workspace) => (
                          <SelectItem key={workspace.id} value={workspace.id}>
                            {workspace.organization.name} - {workspace.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {assigning === user.id && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    )}
                  </div>
                </div>
              ))}
              {unassignedUsers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  All users are assigned to workspaces
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Assigned Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Assigned Users ({assignedUsers.length})
            </CardTitle>
            <CardDescription>
              Users who are assigned to workspaces
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assignedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{user.role}</Badge>
                      {user.organization && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {user.organization.name}
                        </Badge>
                      )}
                      {user.workspace && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <FolderOpen className="h-3 w-3" />
                          {user.workspace.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {assignedUsers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No users assigned to workspaces yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
