"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { UserManagementTable } from "@/components/admin/user-management-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Shield, Users, Building2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface User {
  id: string
  name: string
  email: string
  role: "MEMBER" | "ADMIN"
  workspaceId: string | null
  workspace?: {
    id: string
    name: string
  } | null
  createdAt: string
  _count?: {
    projects: number
    tasks: number
  }
}

export default function UserManagementPage() {
  const { user: currentUser, isLoading: authLoading } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const usersData = await response.json()
        setUsers(usersData)
      } else if (response.status === 403) {
        toast.error("Access denied. Only Admins can manage users.")
        router.push('/dashboard')
      } else {
        throw new Error('Failed to load users')
      }
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        router.push('/auth/signin')
        return
      }

      if (currentUser.role !== 'ADMIN') {
        toast.error("Access denied. Only Admins can access user management.")
        router.push('/dashboard')
        return
      }

      loadUsers()
    }
  }, [currentUser, authLoading, router])

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading user management...</span>
        </div>
      </div>
    )
  }

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Only Admins can access user management.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/dashboard')}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate statistics
  const totalUsers = users.length
  const admins = users.filter(u => u.role === 'ADMIN').length
  const members = users.filter(u => u.role === 'MEMBER').length
  const assignedUsers = users.filter(u => u.workspaceId).length
  const unassignedUsers = users.filter(u => !u.workspaceId).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage users, roles, and permissions across all workspaces
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Across all workspaces
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admins}</div>
            <p className="text-xs text-muted-foreground">
              System administrators
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members}</div>
            <p className="text-xs text-muted-foreground">
              Team members
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assignment Status</CardTitle>
            <CardDescription>
              User workspace assignments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Assigned to Workspaces</span>
              <Badge variant="default">{assignedUsers}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Unassigned Users</span>
              <Badge variant={unassignedUsers > 0 ? "destructive" : "secondary"}>
                {unassignedUsers}
              </Badge>
            </div>
            {unassignedUsers > 0 && (
              <p className="text-xs text-muted-foreground">
                {unassignedUsers} users need to be assigned to workspaces
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>
              Common user management tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {
                // Scroll to the table or focus on add user button
                const addButton = document.querySelector('[data-testid="add-user-button"]')
                if (addButton) {
                  (addButton as HTMLElement).click()
                }
              }}
            >
              <Users className="h-4 w-4 mr-2" />
              Add New User
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={loadUsers}
            >
              <Shield className="h-4 w-4 mr-2" />
              Refresh Users
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* User Management Table */}
      <UserManagementTable users={users} onRefresh={loadUsers} />
    </div>
  )
}
