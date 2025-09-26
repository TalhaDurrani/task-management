"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  FolderPlus, 
  Clock, 
  Users, 
  BarChart3,
  Calendar,
  FileText
} from "lucide-react"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"

export function QuickActions() {
  const [showCreateProject, setShowCreateProject] = useState(false)
  const router = useRouter()

  const actions = [
    {
      title: "Create Project",
      description: "Start a new project",
      icon: FolderPlus,
      onClick: () => setShowCreateProject(true),
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20"
    },
    {
      title: "Log Time",
      description: "Track your work hours",
      icon: Clock,
      onClick: () => router.push("/dashboard/time"),
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/20"
    },
    {
      title: "View Reports",
      description: "Analytics and insights",
      icon: BarChart3,
      onClick: () => router.push("/dashboard/reports"),
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20"
    },
    {
      title: "Team Members",
      description: "Manage your team",
      icon: Users,
      onClick: () => router.push("/dashboard/team"),
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/20"
    },
    {
      title: "Calendar",
      description: "View project timeline",
      icon: Calendar,
      onClick: () => router.push("/dashboard/calendar"),
      color: "text-pink-600",
      bgColor: "bg-pink-50 dark:bg-pink-950/20"
    }
  ]

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant="ghost"
                className="h-auto p-4 justify-start"
                onClick={action.onClick}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${action.bgColor}`}>
                    <action.icon className={`h-4 w-4 ${action.color}`} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{action.title}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <CreateProjectDialog 
        open={showCreateProject} 
        onOpenChange={setShowCreateProject} 
      />
    </>
  )
}
