"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Search, FolderOpen, Users, Folder } from "lucide-react"
import { CreateWorkspaceDialog } from "./create-workspace-dialog"
import { EditWorkspaceDialog } from "./edit-workspace-dialog"
import { DeleteWorkspaceDialog } from "./delete-workspace-dialog"

interface Workspace {
  id: string
  name: string
  description: string | null
  organizationId: string
  createdAt: Date
  updatedAt: Date
  organization: {
    id: string
    name: string
  }
  _count: {
    users: number
    projects: number
  }
}

interface WorkspacesTableProps {
  workspaces: Workspace[]
  onRefresh?: () => void
}

export function WorkspacesTable({ workspaces, onRefresh }: WorkspacesTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [creatingWorkspace, setCreatingWorkspace] = useState(false)
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null)
  const [deletingWorkspace, setDeletingWorkspace] = useState<Workspace | null>(null)

  const filteredWorkspaces = workspaces.filter(
    (workspace) =>
      workspace.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workspace.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workspace.organization.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workspaces..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={() => setCreatingWorkspace(true)}>
          <FolderOpen className="h-4 w-4 mr-2" />
          Create Workspace
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWorkspaces.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchTerm
                    ? "No workspaces found matching your search."
                    : "No workspaces yet. Create your first workspace!"}
                </TableCell>
              </TableRow>
            ) : (
              filteredWorkspaces.map((workspace) => (
                <TableRow key={workspace.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{workspace.name}</div>
                      {workspace.description && (
                        <p className="text-sm text-muted-foreground mt-1">{workspace.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{workspace.organization.name}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{workspace._count.users}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Folder className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{workspace._count.projects}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(workspace.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingWorkspace(workspace)}>
                          Edit Workspace
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeletingWorkspace(workspace)} className="text-destructive">
                          Delete Workspace
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {creatingWorkspace && (
        <CreateWorkspaceDialog
          open={creatingWorkspace}
          onOpenChange={(open) => {
            if (!open) {
              setCreatingWorkspace(false)
              onRefresh?.()
            }
          }}
        />
      )}

      {editingWorkspace && (
        <EditWorkspaceDialog
          workspace={editingWorkspace}
          open={!!editingWorkspace}
          onOpenChange={(open) => {
            if (!open) {
              setEditingWorkspace(null)
              onRefresh?.()
            }
          }}
        />
      )}

      {deletingWorkspace && (
        <DeleteWorkspaceDialog
          workspace={deletingWorkspace}
          open={!!deletingWorkspace}
          onOpenChange={(open) => {
            if (!open) {
              setDeletingWorkspace(null)
              onRefresh?.()
            }
          }}
        />
      )}
    </div>
  )
}
