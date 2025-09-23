"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Plus, 
  Search, 
  Grid3X3,
  List,
  CheckCircle2,
  AlertCircle,
  Circle
} from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog"
import { TaskCard } from "@/components/tasks/task-card"
import { SimpleKanban } from "@/components/tasks/simple-kanban"

export default function TasksPage() {
  const [currentUser, setCurrentUser] = useState(null)
  const [allTasks, setAllTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list" | "kanban">("kanban")
  const [sortBy, setSortBy] = useState("createdAt")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [filterProject, setFilterProject] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  // Transform API task data to UI format
  const transformTaskData = (apiTasks: any[]) => {
    return apiTasks.map(task => ({
      id: task.id,
      title: task.title || 'Untitled Task',
      description: task.description,
      status: mapStatusToUI(task.status),
      priority: "medium", // Default priority since it's not in the API
      labels: task.label ? task.label.split(',').map((l: string) => l.trim()) : [],
      projectId: task.projectId,
      project: {
        id: task.project?.id || task.projectId,
        name: task.project?.title || 'Unknown Project'
      },
      assigneeId: task.assignedTo,
      assignee: task.assignee ? {
        id: task.assignee.id,
        name: task.assignee.name,
        email: task.assignee.email,
        image: undefined
      } : null,
      timelineStart: task.endDate ? new Date(task.endDate) : null,
      timelineEnd: task.dueDate ? new Date(task.dueDate) : null,
      estimatedHours: null,
      loggedHours: 0,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.createdAt)
    }))
  }

  // Map API status to UI status
  const mapStatusToUI = (apiStatus: string) => {
    switch (apiStatus) {
      case 'PENDING': return 'todo'
      case 'IN_PROGRESS': return 'in-progress'
      case 'DONE': return 'done'
      case 'CANCELLED': return 'todo' // Map cancelled to todo for now
      default: return 'todo'
    }
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'GET'
        })
        const result = await response.json()
        
        if (result.success && result.user) {
          setCurrentUser(result.user)
          
          // Load projects first
          const projectsResponse = await fetch('/api/projects')
          if (projectsResponse.ok) {
            const projectsData = await projectsResponse.json()
            setProjects(projectsData)
            
            // Load tasks from all projects
            const allTasksData = []
            for (const project of projectsData) {
              try {
                const tasksResponse = await fetch(`/api/tasks?projectId=${project.id}`)
                if (tasksResponse.ok) {
                  const tasksData = await tasksResponse.json()
                  allTasksData.push(...tasksData)
                }
              } catch (error) {
                console.error(`Error loading tasks for project ${project.id}:`, error)
              }
            }
            
            // Transform the data for UI components
            const transformedTasks = transformTaskData(allTasksData)
            setAllTasks(transformedTasks)
            console.log("Loaded tasks:", transformedTasks.length, "tasks")
          }
        } else {
          router.push("/auth/signin?callbackUrl=/dashboard/tasks")
        }
      } catch (error) {
        console.error('Failed to load tasks data:', error)
        router.push("/auth/signin?callbackUrl=/dashboard/tasks")
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

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Not Authenticated</h3>
          <p className="text-muted-foreground">Please sign in to access tasks.</p>
        </div>
      </div>
    )
  }

  const handleTaskCreated = async () => {
    console.log("Task created successfully! Refreshing tasks...")
    
    // Reload tasks data
    try {
      const allTasksData = []
      for (const project of projects) {
        try {
          const tasksResponse = await fetch(`/api/tasks?projectId=${project.id}`)
          if (tasksResponse.ok) {
            const tasksData = await tasksResponse.json()
            allTasksData.push(...tasksData)
          }
        } catch (error) {
          console.error(`Error loading tasks for project ${project.id}:`, error)
        }
      }
      // Transform the data for UI components
      const transformedTasks = transformTaskData(allTasksData)
      setAllTasks(transformedTasks)
      console.log("Tasks refreshed:", transformedTasks.length, "tasks loaded")
    } catch (error) {
      console.error('Failed to refresh tasks:', error)
    }
  }

  const handleEditTask = (task: any) => {
    console.log("Edit task:", task)
  }

  const handleDeleteTask = (taskId: string) => {
    console.log("Delete task:", taskId)
  }

  // Filter and sort tasks
  const filteredTasks = allTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === "all" || task.status === filterStatus
    const matchesPriority = filterPriority === "all" || task.priority === filterPriority
    const matchesProject = filterProject === "all" || task.projectId === filterProject
    
    return matchesSearch && matchesStatus && matchesPriority && matchesProject
  })

  const sortedTasks = filteredTasks.sort((a, b) => {
    switch (sortBy) {
      case "title":
        return a.title.localeCompare(b.title)
      case "priority":
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      case "dueDate":
        if (!a.timelineEnd && !b.timelineEnd) return 0
        if (!a.timelineEnd) return 1
        if (!b.timelineEnd) return -1
        return new Date(a.timelineEnd).getTime() - new Date(b.timelineEnd).getTime()
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Manage and track all your tasks across projects
          </p>
        </div>
        <CreateTaskDialog onTaskCreated={handleTaskCreated}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Task
          </Button>
        </CreateTaskDialog>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Search tasks..." 
                  className="pl-10" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterProject} onValueChange={setFilterProject}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title || project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="dueDate">Due Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* View Controls */}
            <div className="flex items-center space-x-1">
              <Button
                variant={viewMode === "kanban" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("kanban")}
                title="Kanban Board"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                title="Grid View"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                title="List View"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Display */}
      <div className="space-y-4">
        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {sortedTasks.length} of {allTasks.length} tasks
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>To Do: {allTasks.filter(t => t.status === "todo").length}</span>
            <span>•</span>
            <span>In Progress: {allTasks.filter(t => t.status === "in-progress").length}</span>
            <span>•</span>
            <span>Done: {allTasks.filter(t => t.status === "done").length}</span>
          </div>
        </div>

        {/* Tasks Display */}
        {sortedTasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-muted-foreground mb-4">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery || filterStatus !== "all" || filterPriority !== "all" || filterProject !== "all"
                  ? "Try adjusting your filters or search terms."
                  : "Get started by creating your first task."
                }
              </p>
              <CreateTaskDialog onTaskCreated={handleTaskCreated}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Task
                </Button>
              </CreateTaskDialog>
            </CardContent>
          </Card>
        ) : viewMode === "kanban" ? (
          <SimpleKanban
            tasks={sortedTasks}
            onTaskMove={(taskId, newStatus) => {
              console.log(`Moving task ${taskId} to ${newStatus}`)
            }}
            onTaskEdit={handleEditTask}
            onTaskDelete={handleDeleteTask}
            onCreateTask={(status) => {
              console.log(`Creating task with status: ${status}`)
            }}
          />
        ) : (
          <div className={
            viewMode === "grid" 
              ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
              : "space-y-3"
          }>
            {sortedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
