"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  MessageSquare, 
  Bell, 
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Calendar,
  Flag,
  Archive,
  Trash2
} from "lucide-react"

export const dynamic = 'force-dynamic'

export default function InboxPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Only load data on client side to prevent build-time API calls
    if (typeof window === 'undefined') return

    const loadData = async () => {
      try {
        // Get current user from the new auth system
        const response = await fetch('/api/auth/login', {
          method: 'GET'
        })
        
        const result = await response.json()
        
        if (result.success && result.user) {
          setCurrentUser(result.user)
          // Load notifications from API
          const notificationsResponse = await fetch('/api/activity')
          if (notificationsResponse.ok) {
            const notificationsData = await notificationsResponse.json()
            setNotifications(notificationsData)
          }
        } else {
          // Redirect to sign-in if not authenticated
          window.location.href = "/auth/signin"
        }
      } catch (error) {
        console.error('Error loading inbox data:', error)
        // Redirect to sign-in on error
        window.location.href = "/auth/signin"
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading inbox...</p>
        </div>
      </div>
    )
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "task_assigned":
        return <CheckCircle2 className="h-4 w-4 text-blue-500" />
      case "task_completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "task_overdue":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "project_update":
        return <Bell className="h-4 w-4 text-purple-500" />
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (type: string) => {
    switch (type) {
      case "task_overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "task_assigned":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "task_completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const unreadNotifications = notifications.filter(n => !n.read)
  const readNotifications = notifications.filter(n => n.read)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
          <p className="text-muted-foreground">
            Manage your notifications and messages
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Archive className="mr-2 h-4 w-4" />
            Archive All
          </Button>
          <Button variant="outline" size="sm">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadNotifications.length}</div>
            <p className="text-xs text-muted-foreground">
              New notifications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter(n => {
                const today = new Date()
                const notificationDate = new Date(n.createdAt)
                return notificationDate.toDateString() === today.toDateString()
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Notifications today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter(n => n.type === "task_overdue").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Urgent items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
            <p className="text-xs text-muted-foreground">
              All notifications
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      <Tabs defaultValue="unread" className="space-y-4">
        <TabsList>
          <TabsTrigger value="unread">
            Unread ({unreadNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived (0)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unread" className="space-y-4">
          <div className="space-y-4">
            {unreadNotifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                  <p className="text-muted-foreground text-center">
                    You have no unread notifications.
                  </p>
                </CardContent>
              </Card>
            ) : (
              unreadNotifications.map((notification) => (
                <Card key={notification.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold">{notification.title}</h3>
                          <div className="flex items-center space-x-2">
                            <Badge className={getPriorityColor(notification.type)}>
                              {notification.type.replace("_", " ")}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {notification.message}
                        </p>
                        <div className="flex items-center space-x-4">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          <Button variant="ghost" size="sm">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Mark Read
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Archive className="mr-1 h-3 w-3" />
                            Archive
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={cn(
                  "transition-opacity",
                  notification.read ? "opacity-60" : "border-l-4 border-l-blue-500"
                )}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={cn(
                          "text-sm font-semibold",
                          notification.read ? "text-muted-foreground" : ""
                        )}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(notification.type)}>
                            {notification.type.replace("_", " ")}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <p className={cn(
                        "text-sm mb-3",
                        notification.read ? "text-muted-foreground" : "text-muted-foreground"
                      )}>
                        {notification.message}
                      </p>
                      <div className="flex items-center space-x-4">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        {!notification.read && (
                          <Button variant="ghost" size="sm">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Mark Read
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <Archive className="mr-1 h-3 w-3" />
                          Archive
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="mr-1 h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="archived" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Archive className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No archived notifications</h3>
              <p className="text-muted-foreground text-center">
                Archived notifications will appear here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
