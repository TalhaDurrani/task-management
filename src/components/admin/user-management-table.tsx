"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  UserPlus,
  Shield,
  Building2,
  Users
} from "lucide-react"
import { CreateUserDialog } from "./create-user-dialog"
import { EditUserDialog } from "./edit-user-dialog"
import { DeleteUserDialog } from "./delete-user-dialog"
import { formatDistanceToNow } from "date-fns"

interface User {
  id: string
  name: string
  email: string
  role: "USER" | "ADMIN" | "SUPER_ADMIN"
  organizationId: string | null
  workspaceId: string | null
  organization?: {
    id: string
    name: string
  } | null
  workspace?: {
    id: string
    name: string
  } | null
  createdAt: string
  _count?: {
    projects: number
    tasks: number
  }
}

interface UserManagementTableProps {
  users: User[]
  onRefresh: () => void
}

export function UserManagementTable({ users, onRefresh }: UserManagementTableProps) {
  const [creatingUser, setCreatingUser] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "destructive"
      case "ADMIN":
        return "default"
      case "USER":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return <Shield className="h-3 w-3" />
      case "ADMIN":
        return <Building2 className="h-3 w-3" />
      case "USER":
        return <Users className="h-3 w-3" />
      default:
        return <Users className="h-3 w-3" />
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
            <p className="text-muted-foreground">
              Manage users, roles, and permissions across all organizations
            </p>
          </div>
          <Button onClick={() => setCreatingUser(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Workspace</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" />
                        <AvatarFallback>
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center gap-1 w-fit">
                      {getRoleIcon(user.role)}
                      {user.role.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.organization ? (
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{user.organization.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.workspace ? (
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{user.workspace.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{user._count?.projects || 0}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{user._count?.tasks || 0}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingUser(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeletingUser(user)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No users found</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first user to the system.
            </p>
            <Button onClick={() => setCreatingUser(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateUserDialog 
        open={creatingUser} 
        onOpenChange={setCreatingUser}
        onUserCreated={onRefresh}
      />
      
      {editingUser && (
        <EditUserDialog 
          user={editingUser}
          open={!!editingUser} 
          onOpenChange={(open) => !open && setEditingUser(null)}
          onUserUpdated={onRefresh}
        />
      )}
      
      {deletingUser && (
        <DeleteUserDialog 
          user={deletingUser}
          open={!!deletingUser} 
          onOpenChange={(open) => !open && setDeletingUser(null)}
          onUserDeleted={onRefresh}
        />
      )}
    </>
  )
}
