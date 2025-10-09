"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { Bell, Check, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  useEffect(() => {
    // Only load data on client side to prevent build-time API calls
    if (typeof window === 'undefined') return

    const loadData = async () => {
      try {
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
        }
      } catch (error) {
        console.error('Failed to load notifications:', error)
      }
    }
    
    loadData()
  }, [])
  
  const userNotifications = notifications
  const unreadCount = userNotifications.filter(n => !n.read).length

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.userId === currentUser.id 
          ? { ...notification, read: true }
          : notification
      )
    )
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "task_assigned":
        return "📋"
      case "task_completed":
        return "✅"
      case "comment_added":
        return "💬"
      case "deadline_approaching":
        return "⏰"
      default:
        return "🔔"
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "task_assigned":
        return "text-blue-600"
      case "task_completed":
        return "text-green-600"
      case "comment_added":
        return "text-purple-600"
      case "deadline_approaching":
        return "text-orange-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" sideOffset={5}>
        <div className="flex items-center justify-between p-4">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-96">
          {userNotifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="p-2">
              {userNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                    !notification.read ? "bg-blue-50 dark:bg-blue-950/20" : ""
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-lg">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${getNotificationColor(notification.type)}`}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="h-2 w-2 bg-blue-600 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
