"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserWorkspaceAssignment } from "@/components/admin/user-workspace-assignment"

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

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
          
          // Check if user is admin or super admin
          if (userResult.user.role !== 'ADMIN' && userResult.user.role !== 'SUPER_ADMIN') {
            router.push('/dashboard')
            return
          }
        } else {
          router.push("/auth/signin?callbackUrl=/dashboard/admin/users")
        }
      } catch (error) {
        console.error('Failed to load data:', error)
        router.push("/auth/signin?callbackUrl=/dashboard/admin/users")
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

  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
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
      <UserWorkspaceAssignment />
    </div>
  )
}
