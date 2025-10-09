"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { JoinWorkspaceDialog } from "@/components/workspaces/join-workspace-dialog"
import { 
  LayoutDashboard, 
  FolderOpen, 
  CheckSquare, 
  Clock, 
  BarChart3, 
  Users,
  Plus,
  Search,
  Star,
  Calendar,
  Flag,
  MessageSquare,
  Settings,
  Zap,
  Target,
  TrendingUp,
  FileText,
  Archive,
  Shield,
  Code,
  ChevronLeft,
  ChevronRight,
  Building2,
  LogIn
} from "lucide-react"
// Dynamic navigation based on current user
const getMainNavigation = (currentUser: any, userTaskCount: number = 0, inboxCount: number = 0) => [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: "My Tasks",
    href: "/dashboard/tasks",
    icon: CheckSquare,
    badge: userTaskCount > 0 ? userTaskCount : null,
  },
  {
    name: "Inbox",
    href: "/dashboard/inbox",
    icon: MessageSquare,
    badge: inboxCount > 0 ? inboxCount : null,
  },
]

const workspaceNavigation = [
  {
    name: "Workspaces",
    href: "/dashboard/workspaces",
    icon: Building2,
    badge: null,
  },
]

const projectNavigation = [
  {
    name: "Projects",
    href: "/dashboard/projects",
    icon: FolderOpen,
    badge: null,
  },
]

const analyticsNavigation = [
  {
    name: "Time Tracking",
    href: "/dashboard/time",
    icon: Clock,
    badge: null,
  },
  {
    name: "Sprints",
    href: "/dashboard/sprints",
    icon: Target,
    badge: null,
  },
  {
    name: "Goals & OKRs",
    href: "/dashboard/goals",
    icon: Flag,
    badge: null,
  },
  {
    name: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    badge: null,
  },
]

const teamNavigation = [
  {
    name: "Team",
    href: "/dashboard/team",
    icon: Users,
    badge: null,
  },
]

const adminNavigation = [
  {
    name: "Users",
    href: "/dashboard/admin/users",
    icon: Users,
    badge: null,
  },
  {
    name: "User Management",
    href: "/dashboard/admin/user-management",
    icon: Shield,
    badge: null,
  },
  {
    name: "Custom Fields",
    href: "/dashboard/custom-fields",
    icon: Settings,
    badge: null,
  },
]

const developerNavigation = [
  {
    name: "Developer Tools",
    href: "/dashboard/developer",
    icon: Code,
    badge: null,
  },
]

const quickActions = [
  {
    name: "Create Task",
    href: "/dashboard/tasks?create=true",
    icon: Plus,
    variant: "default" as const,
  },
  {
    name: "Create Project",
    href: "/dashboard/projects?create=true",
    icon: FolderOpen,
    variant: "outline" as const,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [showAllWorkspaces, setShowAllWorkspaces] = useState(false)
  const [userTaskCount, setUserTaskCount] = useState(0)
  const [inboxCount, setInboxCount] = useState(0)
  const [projectCount, setProjectCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  // Load current user and data
  useEffect(() => {
    // Only load data on client side to prevent build-time API calls
    if (typeof window !== 'undefined') {
      loadData()
    }
  }, [])

  // Refresh data when pathname changes (for project creation)
  useEffect(() => {
    if (pathname.includes('/dashboard/projects')) {
      loadProjects()
    }
  }, [pathname])
  
  const loadData = async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'GET'
      })
      const result = await response.json()
      
      if (result.success && result.user) {
        setCurrentUser(result.user)
        
        // Load all data in parallel
        await Promise.all([
          loadProjects(),
          loadWorkspaces(),
          loadUserTasks(result.user.id),
          loadInboxCount()
        ])
      }
    } catch (error) {
      console.error('Failed to load sidebar data:', error)
    }
    setIsLoading(false)
  }

  const loadProjects = async () => {
    try {
      const projectsResponse = await fetch('/api/projects')
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json()
        setProjects(projectsData)
        setProjectCount(projectsData.length)
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const loadWorkspaces = async () => {
    try {
      const workspacesResponse = await fetch('/api/workspaces')
      if (workspacesResponse.ok) {
        const workspacesData = await workspacesResponse.json()
        setWorkspaces(workspacesData)
      }
    } catch (error) {
      console.error('Error loading workspaces:', error)
    }
  }

  const loadUserTasks = async (userId: string) => {
    try {
      const tasksResponse = await fetch(`/api/tasks`)
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json()
        // Count tasks assigned to current user
        const userTasks = tasksData.filter((t: any) => 
          t.assignees?.some((a: any) => a.id === userId)
        )
        setUserTaskCount(userTasks.length)
      }
    } catch (error) {
      console.error('Error loading user tasks:', error)
    }
  }

  const loadInboxCount = async () => {
    try {
      // Load notifications/activity count
      const activityResponse = await fetch('/api/activity')
      if (activityResponse.ok) {
        const activityData = await activityResponse.json()
        // Count unread activities
        const unreadCount = activityData.filter((a: any) => !a.read).length
        setInboxCount(unreadCount)
      }
    } catch (error) {
      console.error('Error loading inbox count:', error)
      setInboxCount(0)
    }
  }

  const NavigationSection = ({ title, items, showAddButton = false }: {
    title: string
    items: Array<{
      name: string
      href: string
      icon: any
      badge?: number | null
    }>
    showAddButton?: boolean
  }) => (
    <div className="mb-6">
      {!isCollapsed && (
        <div className="flex items-center justify-between px-3 mb-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </h3>
          {showAddButton && (
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
      <div className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <Button
              key={item.name}
              variant="ghost"
              className={cn(
                "w-full justify-start h-8 px-3 text-sm font-normal",
                isActive && "bg-accent text-accent-foreground font-medium",
                isCollapsed && "px-2"
              )}
              asChild
              title={isCollapsed ? item.name : undefined}
            >
              <Link href={item.href}>
                <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left">{item.name}</span>
                    {item.badge && item.badge > 0 && (
                      <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            </Button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className={cn(
      "flex h-full flex-col bg-background border-r border-border transition-all duration-300",
      isCollapsed ? "w-16" : "w-72"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className={cn("flex items-center space-x-3", isCollapsed && "space-x-0")}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="font-semibold text-lg">TaskFlow</h1>
                <p className="text-xs text-muted-foreground">Project Management</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search tasks, projects..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-muted border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {/* <div className="p-4 border-b border-border">
        {isCollapsed ? (
          <div className="space-y-2">
            {quickActions.map((action) => (
              <Button
                key={action.name}
                variant={action.variant}
                size="sm"
                className="h-8 w-8 p-0"
                asChild
                title={action.name}
              >
                <Link href={action.href}>
                  <action.icon className="h-3 w-3" />
                </Link>
              </Button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.name}
                variant={action.variant}
                size="sm"
                className="h-8 text-xs"
                asChild
              >
                <Link href={action.href}>
                  <action.icon className="mr-1 h-3 w-3" />
                  {action.name}
                </Link>
              </Button>
            ))}
          </div>
        )}
      </div> */}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Main Navigation */}
        <NavigationSection title="Main" items={getMainNavigation(currentUser, userTaskCount, inboxCount)} />

        {/* Workspaces Section */}
        {!isCollapsed && (
          <div className="mb-6">
            <div className="flex items-center justify-between px-3 mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Workspaces
              </h3>
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {workspaces.length}
              </Badge>
            </div>
            <div className="space-y-1">
              {/* Show first 3 workspaces or all if showAllWorkspaces is true */}
              {(showAllWorkspaces ? workspaces : workspaces.slice(0, 3)).map((workspace) => {
                // Check if we're on the workspaces page viewing this workspace
                const isActive = pathname === "/dashboard/workspaces" && 
                                currentUser?.workspaceId === workspace.id
                return (
                  <Button
                    key={workspace.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-8 px-3 text-sm font-normal",
                      isActive && "bg-accent text-accent-foreground font-medium"
                    )}
                    asChild
                  >
                    <Link href="/dashboard/workspaces">
                      <Building2 className="mr-3 h-4 w-4" />
                      <span className="flex-1 text-left truncate">{workspace.name}</span>
                      {currentUser?.workspaceId === workspace.id && (
                        <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
                          Active
                        </Badge>
                      )}
                    </Link>
                  </Button>
                )
              })}
              
              {/* View More / View Less Button */}
              {workspaces.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-7 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setShowAllWorkspaces(!showAllWorkspaces)}
                >
                  {showAllWorkspaces ? (
                    <>
                      <ChevronLeft className="mr-1 h-3 w-3" />
                      View Less
                    </>
                  ) : (
                    <>
                      <ChevronRight className="mr-1 h-3 w-3" />
                      View More ({workspaces.length - 3})
                    </>
                  )}
                </Button>
              )}

              {/* Empty State */}
              {workspaces.length === 0 && (
                <div className="px-3 py-4 text-center">
                  <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No workspaces yet</p>
                </div>
              )}
            </div>

            {/* Join Workspace Button */}
            <div className="px-3 mt-3">
              <JoinWorkspaceDialog>
                <Button variant="outline" size="sm" className="w-full justify-start h-8">
                  <LogIn className="mr-2 h-4 w-4" />
                  Join Workspace
                </Button>
              </JoinWorkspaceDialog>
            </div>
          </div>
        )}

        {/* Collapsed Workspace Link */}
        {isCollapsed && (
          <div className="mb-6">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start h-8 px-2",
                pathname === "/dashboard/workspaces" && "bg-accent text-accent-foreground font-medium"
              )}
              asChild
              title="Workspaces"
            >
              <Link href="/dashboard/workspaces">
                <Building2 className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}

        {/* Projects */}
        {!isCollapsed && (
          <div className="mb-6">
            <div className="flex items-center justify-between px-3 mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Projects
              </h3>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" asChild>
                <Link href="/dashboard/projects?create=true">
                  <Plus className="h-3 w-3" />
                </Link>
              </Button>
            </div>
            <div className="space-y-1">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start h-8 px-3 text-sm font-normal",
                  pathname === "/dashboard/projects" && "bg-accent text-accent-foreground font-medium"
                )}
                asChild
              >
                <Link href="/dashboard/projects">
                  <FolderOpen className="mr-3 h-4 w-4" />
                  <span className="flex-1 text-left">All Projects</span>
                  <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
                    {projectCount}
                  </Badge>
                </Link>
              </Button>
              
              {/* Recent Projects (First 5) */}
              {projects.slice(0, 5).map((project) => {
                const projectTasks = project.tasks || []
                const isActive = pathname === `/dashboard/projects/${project.id}`
                
                return (
                  <Button
                    key={project.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-8 px-3 text-sm font-normal pl-6",
                      isActive && "bg-accent text-accent-foreground font-medium"
                    )}
                    asChild
                  >
                    <Link href={`/dashboard/projects/${project.id}`}>
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-3 flex-shrink-0" />
                      <span className="flex-1 text-left truncate">{project.title || project.name}</span>
                      {projectTasks.length > 0 && (
                        <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
                          {projectTasks.length}
                        </Badge>
                      )}
                    </Link>
                  </Button>
                )
              })}

              {/* Empty State */}
              {projects.length === 0 && (
                <div className="px-3 py-4 text-center">
                  <FolderOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-2">No projects yet</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/projects?create=true">
                      <Plus className="h-3 w-3 mr-1" />
                      Create Project
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Collapsed Projects Link */}
        {isCollapsed && (
          <div className="mb-6">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start h-8 px-2",
                pathname.includes("/dashboard/projects") && "bg-accent text-accent-foreground font-medium"
              )}
              asChild
              title="Projects"
            >
              <Link href="/dashboard/projects">
                <FolderOpen className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}

        {/* Analytics */}
        <NavigationSection title="Analytics" items={analyticsNavigation} />

        {/* Team */}
        <NavigationSection title="Team" items={teamNavigation} />

        {/* Admin Section - Only show for admin users */}
        {currentUser?.role === "ADMIN" && (
          <NavigationSection title="Administration" items={adminNavigation} />
        )}

        {/* Favorites */}
        <div className="mb-6">
          <div className="flex items-center justify-between px-3 mb-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Favorites
            </h3>
          </div>
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start h-8 px-3 text-sm font-normal"
            >
              <Star className="mr-3 h-4 w-4" />
              <span className="flex-1 text-left">Starred Tasks</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start h-8 px-3 text-sm font-normal"
            >
              <Flag className="mr-3 h-4 w-4" />
              <span className="flex-1 text-left">High Priority</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start h-8 px-3 text-sm font-normal"
            >
              <Calendar className="mr-3 h-4 w-4" />
              <span className="flex-1 text-left">Due Today</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        {isCollapsed ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">
                {currentUser?.name?.[0] || currentUser?.email?.[0] || "U"}
              </span>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Settings">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">
                {currentUser?.name?.[0] || currentUser?.email?.[0] || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentUser?.name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{currentUser?.email || "user@example.com"}</p>
            </div>
            {/* <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Settings className="h-4 w-4" />
            </Button> */}
          </div>
        )}
      </div>
    </div>
  )
}
