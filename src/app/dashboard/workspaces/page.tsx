"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FolderOpen, 
  Users, 
  Plus, 
  Settings,
  Loader2,
  Folder,
  UserPlus,
  LayoutGrid,
  Building2,
  Trash2,
  Copy,
  Check,
  LogIn
} from "lucide-react"
import { CreateWorkspaceDialog } from "@/components/workspaces/create-workspace-dialog"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"
import { AddUserToWorkspaceDialog } from "@/components/workspaces/add-user-to-workspace-dialog"
import { JoinWorkspaceDialog } from "@/components/workspaces/join-workspace-dialog"
import { toast } from "sonner"

interface Workspace {
  id: string
  name: string
  description: string | null
  joinCode?: string
  createdAt: Date
  updatedAt: Date
  _count: {
    users: number
    projects: number
  }
  projects?: Project[]
  users?: WorkspaceUser[]
}

interface Project {
  id: string
  title: string
  description: string | null
  _count: {
    tasks: number
  }
}

interface WorkspaceUser {
  id: string
  name: string
  email: string
  role: string
  createdAt: Date
}

export default function WorkspacesPage() {
  const { user: currentUser, isLoading: authLoading } = useAuth()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false)
  const [createProjectOpen, setCreateProjectOpen] = useState(false)
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [joinWorkspaceOpen, setJoinWorkspaceOpen] = useState(false)
  const router = useRouter()

  const loadWorkspaces = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/workspaces')
      if (response.ok) {
        const data = await response.json()
        setWorkspaces(data)
        // Auto-select first workspace if none selected
        if (data.length > 0 && !selectedWorkspace) {
          setSelectedWorkspace(data[0])
        }
      } else {
        toast.error("Failed to load workspaces")
      }
    } catch (error) {
      console.error('Error loading workspaces:', error)
      toast.error('Failed to load workspaces')
    } finally {
      setIsLoading(false)
    }
  }

  const loadWorkspaceProjects = async (workspaceId: string) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/projects`)
      if (response.ok) {
        const projects = await response.json()
        setWorkspaces(prev => prev.map(ws => 
          ws.id === workspaceId ? { ...ws, projects } : ws
        ))
        if (selectedWorkspace?.id === workspaceId) {
          setSelectedWorkspace(prev => prev ? { ...prev, projects } : null)
        }
      }
    } catch (error) {
      console.error('Error loading workspace projects:', error)
    }
  }

  const loadWorkspaceUsers = async (workspaceId: string) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/users`)
      if (response.ok) {
        const users = await response.json()
        setWorkspaces(prev => prev.map(ws => 
          ws.id === workspaceId ? { ...ws, users } : ws
        ))
        if (selectedWorkspace?.id === workspaceId) {
          setSelectedWorkspace(prev => prev ? { ...prev, users } : null)
        }
      }
    } catch (error) {
      console.error('Error loading workspace users:', error)
    }
  }

  const handleRemoveUser = async (userId: string) => {
    if (!selectedWorkspace) return
    
    if (!confirm('Are you sure you want to remove this user from the workspace?')) {
      return
    }

    try {
      const response = await fetch(`/api/workspaces/${selectedWorkspace.id}/users?userId=${userId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to remove user')
      }

      toast.success('User removed from workspace')
      loadWorkspaceUsers(selectedWorkspace.id)
    } catch (error) {
      console.error('Error removing user:', error)
      toast.error('Failed to remove user')
    }
  }

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        router.push('/auth/signin')
        return
      }
      loadWorkspaces()
    }
  }, [currentUser, authLoading, router])

  useEffect(() => {
    if (selectedWorkspace) {
      loadWorkspaceProjects(selectedWorkspace.id)
      loadWorkspaceUsers(selectedWorkspace.id)
    }
  }, [selectedWorkspace?.id])

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading workspaces...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>
          <p className="text-muted-foreground">
            Manage your workspaces, projects, and team members
          </p>
        </div>
        <Button onClick={() => setCreateWorkspaceOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Workspace
        </Button>
      </div>

      {workspaces.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No workspaces yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first workspace to start organizing projects and teams
            </p>
            <div className="flex gap-2">
              <Button onClick={() => setCreateWorkspaceOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Workspace
              </Button>
              <Button variant="outline" onClick={() => setJoinWorkspaceOpen(true)}>
                <LogIn className="h-4 w-4 mr-2" />
                Join Workspace
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Workspace List Sidebar */}
          <div className="lg:col-span-3 space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground px-2 mb-2">
              YOUR WORKSPACES
            </h3>
            {workspaces.map((workspace) => (
              <Button
                key={workspace.id}
                variant={selectedWorkspace?.id === workspace.id ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setSelectedWorkspace(workspace)}
              >
                <Building2 className="h-4 w-4 mr-2" />
                <span className="flex-1 text-left truncate">{workspace.name}</span>
                <Badge variant="outline" className="ml-2">
                  {workspace._count.projects}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Workspace Details */}
          <div className="lg:col-span-9">
            {selectedWorkspace && (
              <Tabs defaultValue="projects" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedWorkspace.name}</h2>
                    {selectedWorkspace.description && (
                      <p className="text-muted-foreground">{selectedWorkspace.description}</p>
                    )}
                  </div>
                  <TabsList>
                    <TabsTrigger value="projects">Projects</TabsTrigger>
                    <TabsTrigger value="members">Members</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>
                </div>

                {/* Projects Tab */}
                <TabsContent value="projects" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Folder className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">Projects</h3>
                      <Badge variant="secondary">{selectedWorkspace._count.projects}</Badge>
                    </div>
                    <Button onClick={() => setCreateProjectOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Project
                    </Button>
                  </div>

                  {selectedWorkspace.projects && selectedWorkspace.projects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedWorkspace.projects.map((project) => (
                        <Card key={project.id} className="hover:shadow-md transition-shadow">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg">{project.title}</CardTitle>
                                {project.description && (
                                  <CardDescription className="mt-1">
                                    {project.description}
                                  </CardDescription>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <span>{project._count.tasks} tasks</span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                              >
                                View →
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <LayoutGrid className="h-12 w-12 text-muted-foreground mb-4" />
                        <h4 className="text-lg font-semibold mb-2">No projects yet</h4>
                        <p className="text-muted-foreground text-center mb-4">
                          Create your first project in this workspace
                        </p>
                        <Button onClick={() => setCreateProjectOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Project
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Members Tab */}
                <TabsContent value="members" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">Team Members</h3>
                      <Badge variant="secondary">{selectedWorkspace.users?.length || 0}</Badge>
                    </div>
                    {currentUser?.role === 'ADMIN' && (
                      <Button onClick={() => setAddUserOpen(true)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Member
                      </Button>
                    )}
                  </div>

                  {selectedWorkspace.users && selectedWorkspace.users.length > 0 ? (
                    <div className="grid gap-4">
                      {selectedWorkspace.users.map((user) => (
                        <Card key={user.id}>
                          <CardContent className="flex items-center justify-between p-4">
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                                {user.role}
                              </Badge>
                              {currentUser?.role === 'ADMIN' && currentUser.id !== user.id && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveUser(user.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Users className="h-12 w-12 text-muted-foreground mb-4" />
                        <h4 className="text-lg font-semibold mb-2">No members yet</h4>
                        <p className="text-muted-foreground text-center mb-4">
                          Add team members to collaborate in this workspace
                        </p>
                        {currentUser?.role === 'ADMIN' && (
                          <Button onClick={() => setAddUserOpen(true)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Member
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">Workspace Settings</h3>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Workspace Join Code</CardTitle>
                      <CardDescription>
                        Share this code with team members to let them join this workspace
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 p-3 bg-muted rounded-md font-mono text-lg font-semibold">
                            <span className="flex-1">{selectedWorkspace.joinCode || 'Loading...'}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (selectedWorkspace.joinCode) {
                                  navigator.clipboard.writeText(selectedWorkspace.joinCode)
                                  toast.success('Join code copied to clipboard!')
                                }
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Anyone with this code can join your workspace. Keep it secure!
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <CreateWorkspaceDialog
        open={createWorkspaceOpen}
        onOpenChange={setCreateWorkspaceOpen}
        onWorkspaceCreated={loadWorkspaces}
      />

      {selectedWorkspace && (
        <>
          <CreateProjectDialog
            open={createProjectOpen}
            onOpenChange={setCreateProjectOpen}
            onProjectCreated={() => {
              loadWorkspaceProjects(selectedWorkspace.id)
              loadWorkspaces()
              setCreateProjectOpen(false)
            }}
            workspaceId={selectedWorkspace.id}
          />

          <AddUserToWorkspaceDialog
            open={addUserOpen}
            onOpenChange={setAddUserOpen}
            workspaceId={selectedWorkspace.id}
            onUserAdded={() => {
              loadWorkspaceUsers(selectedWorkspace.id)
              loadWorkspaces()
            }}
          />
        </>
      )}

      {/* Join Workspace Dialog */}
      <JoinWorkspaceDialog
        open={joinWorkspaceOpen}
        onOpenChange={setJoinWorkspaceOpen}
        onSuccess={loadWorkspaces}
      />
    </div>
  )
}
