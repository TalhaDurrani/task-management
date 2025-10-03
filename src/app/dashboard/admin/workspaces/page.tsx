"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WorkspacesTable } from "@/components/workspaces/workspaces-table"
import { FolderOpen } from "lucide-react"

interface Workspace {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  _count: {
    users: number
    projects: number
  }
}

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const router = useRouter()

  const loadWorkspaces = async () => {
    try {
      const workspacesResponse = await fetch('/api/workspaces')
      if (workspacesResponse.ok) {
        const workspacesData = await workspacesResponse.json()
        setWorkspaces(workspacesData)
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current user
        const userResponse = await fetch('/api/auth/login', {
          method: 'GET'
        })
        
        const userResult = await userResponse.json()
        
        if (userResult.success && userResult.user) {
          setCurrentUser(userResult.user)
          
          // Check if user is admin
          if (userResult.user.role !== 'ADMIN') {
            router.push('/dashboard')
            return
          }

          // Load workspaces
          await loadWorkspaces()
        } else {
          router.push("/auth/signin?callbackUrl=/dashboard/admin/workspaces")
        }
      } catch (error) {
        console.error('Failed to load data:', error)
        router.push("/auth/signin?callbackUrl=/dashboard/admin/workspaces")
      }
      setIsLoading(false)
    }
    
    loadData()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-muted-foreground">
                Only admins can access this page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>
        <p className="text-muted-foreground">
          Manage all workspaces, projects, and team collaboration.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            All Workspaces
          </CardTitle>
          <CardDescription>
            Create and manage workspaces. Each workspace can contain multiple projects.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkspacesTable workspaces={workspaces} onRefresh={loadWorkspaces} />
        </CardContent>
      </Card>
    </div>
  )
}
