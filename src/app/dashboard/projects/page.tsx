"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
// Removed ProjectService import - using API calls instead
import { ProjectsTable } from "@/components/projects/projects-table"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
// Remove old hardcoded auth import

export default function ProjectsPage() {
  const { user: currentUser, isLoading } = useAuth()
  const [projects, setProjects] = useState([])
  const router = useRouter()

  useEffect(() => {
    const loadProjects = async () => {
      if (currentUser) {
        try {
          const projectsResponse = await fetch('/api/projects')
          if (projectsResponse.ok) {
            const projectsData = await projectsResponse.json()
            setProjects(projectsData)
          }
        } catch (error) {
          console.error('Failed to load projects:', error)
        }
      }
    }

    loadProjects()
  }, [currentUser])

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
          <p className="text-muted-foreground">Please sign in to access projects.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage your projects and collaborate with your team</p>
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
