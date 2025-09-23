"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Search, Building2, Users, FolderOpen, Folder } from "lucide-react"
import { CreateOrganizationDialog } from "./create-organization-dialog"
import { EditOrganizationDialog } from "./edit-organization-dialog"
import { DeleteOrganizationDialog } from "./delete-organization-dialog"

interface Organization {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  _count: {
    users: number
    workspaces: number
    projects: number
  }
}

interface OrganizationsTableProps {
  organizations: Organization[]
  onRefresh?: () => void
}

export function OrganizationsTable({ organizations, onRefresh }: OrganizationsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [creatingOrganization, setCreatingOrganization] = useState(false)
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null)
  const [deletingOrganization, setDeletingOrganization] = useState<Organization | null>(null)

  const filteredOrganizations = organizations.filter(
    (org) =>
      org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={() => setCreatingOrganization(true)}>
          <Building2 className="h-4 w-4 mr-2" />
          Create Organization
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Workspaces</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrganizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchTerm
                    ? "No organizations found matching your search."
                    : "No organizations yet. Create your first organization!"}
                </TableCell>
              </TableRow>
            ) : (
              filteredOrganizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{org.name}</div>
                      {org.description && (
                        <p className="text-sm text-muted-foreground mt-1">{org.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{org._count.users}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{org._count.workspaces}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Folder className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{org._count.projects}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(org.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingOrganization(org)}>
                          Edit Organization
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeletingOrganization(org)} className="text-destructive">
                          Delete Organization
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

      {creatingOrganization && (
        <CreateOrganizationDialog
          open={creatingOrganization}
          onOpenChange={(open) => {
            if (!open) {
              setCreatingOrganization(false)
              onRefresh?.()
            }
          }}
        />
      )}

      {editingOrganization && (
        <EditOrganizationDialog
          organization={editingOrganization}
          open={!!editingOrganization}
          onOpenChange={(open) => {
            if (!open) {
              setEditingOrganization(null)
              onRefresh?.()
            }
          }}
        />
      )}

      {deletingOrganization && (
        <DeleteOrganizationDialog
          organization={deletingOrganization}
          open={!!deletingOrganization}
          onOpenChange={(open) => {
            if (!open) {
              setDeletingOrganization(null)
              onRefresh?.()
            }
          }}
        />
      )}
    </div>
  )
}
