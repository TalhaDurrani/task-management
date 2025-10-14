"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useWorkspace } from "@/components/providers/workspace-provider"
// Removed ProjectService import - using API calls instead
import { ProjectsTable } from "@/components/projects/projects-table"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"
import { Button } from "@/components/ui/button"
import { LoadingProjects } from "@/components/ui/loading"
import { Plus } from "lucide-react"
// Remove old hardcoded auth import

export default function ProjectsPage() {
  const { user: currentUser, isLoading } = useAuth()
  const { selectedWorkspace, isLoading: workspaceLoading } = useWorkspace()
  const [projects, setProjects] = useState([])
  const router = useRouter()

  useEffect(() => {
    const loadProjects = async () => {
      if (currentUser && selectedWorkspace) {
        try {
          // Load projects from the selected workspace
          const projectsResponse = await fetch(`/api/projects?workspaceId=${selectedWorkspace.id}`)
          if (projectsResponse.ok) {
            const projectsData = await projectsResponse.json()
            setProjects(projectsData)
          }
        } catch (error) {
          console.error('Failed to load projects:', error)
        }
      }
    }

    if (!isLoading && !workspaceLoading && selectedWorkspace) {
      loadProjects()
    }
  }, [currentUser?.id, selectedWorkspace?.id, isLoading, workspaceLoading])

  if (isLoading || workspaceLoading) {
    return <LoadingProjects />
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Not Authenticated</h3>
          <p className="text-muted-foreground">Please sign in to access projects.</p>
        </div>
      </div>
    )
  }

  if (!selectedWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No Workspace Selected</h3>
          <p className="text-muted-foreground">Please select a workspace to view projects.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your projects in {selectedWorkspace.name} workspace
          </p>
        </div>
        <CreateProjectDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </CreateProjectDialog>
      </div>

      <ProjectsTable projects={projects} />
    </div>
  )
}
