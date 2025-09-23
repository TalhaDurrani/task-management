"use client"

import { useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Search, Users, CheckSquare } from "lucide-react"
import { EditProjectDialog } from "./edit-project-dialog"
import { DeleteProjectDialog } from "./delete-project-dialog"

interface Project {
  id: string
  title: string
  name: string
  description: string | null
  owner: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  members: Array<{
    user: {
      id: string
      name: string | null
      email: string
      image: string | null
    }
  }>
  tasks: Array<{
    id: string
    status: string
  }>
  createdAt: Date
  completedAt: Date | null
}

interface ProjectsTableProps {
  projects: Project[]
}

export function ProjectsTable({ projects }: ProjectsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [deletingProject, setDeletingProject] = useState<Project | null>(null)

  const filteredProjects = projects.filter(
    (project) =>
      project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getTaskStats = (tasks: Project["tasks"]) => {
    const total = tasks.length
    const completed = tasks.filter((task) => task.status === "done").length
    return { total, completed }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Tasks</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchTerm
                    ? "No projects found matching your search."
                    : "No projects yet. Create your first project!"}
                </TableCell>
              </TableRow>
            ) : (
              filteredProjects.map((project) => {
                const taskStats = getTaskStats(project.tasks)
                return (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div>
                        <Link href={`/dashboard/projects/${project.id}`} className="font-medium hover:underline">
                          {project.title}
                        </Link>
                        {project.description && (
                          <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={project.owner.image || ""} />
                          <AvatarFallback className="text-xs">
                            {project.owner.name?.[0] || project.owner.email[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{project.owner.name || project.owner.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{(project.members?.length || 0) + 1}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <CheckSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {taskStats.completed}/{taskStats.total}
                        </span>
                        {taskStats.total > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {Math.round((taskStats.completed / taskStats.total) * 100)}%
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/projects/${project.id}`}>View Details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditingProject(project)}>Edit Project</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeletingProject(project)} className="text-destructive">
                            Delete Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {editingProject && (
        <EditProjectDialog
          project={editingProject}
          open={!!editingProject}
          onOpenChange={(open) => !open && setEditingProject(null)}
        />
      )}

      {deletingProject && (
        <DeleteProjectDialog
          project={deletingProject}
          open={!!deletingProject}
          onOpenChange={(open) => !open && setDeletingProject(null)}
        />
      )}
    </div>
  )
}
