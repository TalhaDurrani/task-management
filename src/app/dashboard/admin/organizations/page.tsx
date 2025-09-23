"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { OrganizationsTable } from "@/components/organizations/organizations-table"
import { Building2 } from "lucide-react"

interface Organization {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  _count: {
    users: number
    workspaces: number
    projects: number
  }
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const router = useRouter()

  const loadOrganizations = async () => {
    try {
      const orgsResponse = await fetch('/api/organizations')
      if (orgsResponse.ok) {
        const orgsData = await orgsResponse.json()
        setOrganizations(orgsData)
      }
    } catch (error) {
      console.error('Failed to load organizations:', error)
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
          
          // Check if user is super admin
          if (userResult.user.role !== 'SUPER_ADMIN') {
            router.push('/dashboard')
            return
          }

          // Load organizations
          await loadOrganizations()
        } else {
          router.push("/auth/signin?callbackUrl=/dashboard/admin/organizations")
        }
      } catch (error) {
        console.error('Failed to load data:', error)
        router.push("/auth/signin?callbackUrl=/dashboard/admin/organizations")
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

  if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-muted-foreground">
                Only super admins can access this page.
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
        <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
        <p className="text-muted-foreground">
          Manage organizations and their workspaces.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            All Organizations
          </CardTitle>
          <CardDescription>
            Create and manage organizations. Each organization can have multiple workspaces.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationsTable organizations={organizations} onRefresh={loadOrganizations} />
        </CardContent>
      </Card>
    </div>
  )
}
