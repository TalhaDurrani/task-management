"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

const editUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Invalid email address"),
  password: z.string().optional(),
  role: z.enum(["USER", "ADMIN", "SUPER_ADMIN"]),
  organizationId: z.string().optional(),
  workspaceId: z.string().optional()
})

type EditUserFormData = z.infer<typeof editUserSchema>

interface User {
  id: string
  name: string
  email: string
  role: "USER" | "ADMIN" | "SUPER_ADMIN"
  organizationId: string | null
  workspaceId: string | null
}

interface EditUserDialogProps {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserUpdated: () => void
}

export function EditUserDialog({ user, open, onOpenChange, onUserUpdated }: EditUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [organizations, setOrganizations] = useState([])
  const [workspaces, setWorkspaces] = useState([])

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      organizationId: user.organizationId || "",
      workspaceId: user.workspaceId || ""
    }
  })

  // Reset form when user changes
  useEffect(() => {
    form.reset({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      organizationId: user.organizationId || "",
      workspaceId: user.workspaceId || ""
    })
  }, [user, form])

  // Load organizations and workspaces when dialog opens
  useEffect(() => {
    if (open) {
      const loadData = async () => {
        try {
          const [orgsResponse, workspacesResponse] = await Promise.all([
            fetch('/api/organizations'),
            fetch('/api/workspaces')
          ])

          if (orgsResponse.ok) {
            const orgsData = await orgsResponse.json()
            setOrganizations(orgsData)
          }

          if (workspacesResponse.ok) {
            const workspacesData = await workspacesResponse.json()
            setWorkspaces(workspacesData)
          }
        } catch (error) {
          console.error('Error loading data:', error)
        }
      }

      loadData()
    }
  }, [open])

  const onSubmit = async (data: EditUserFormData) => {
    setIsLoading(true)
    try {
      const updateData: any = {
        name: data.name,
        email: data.email,
        role: data.role,
        organizationId: data.organizationId || null,
        workspaceId: data.workspaceId || null
      }

      // Only include password if it's provided
      if (data.password && data.password.trim()) {
        updateData.password = data.password
      }

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update user')
      }

      toast.success("User updated successfully!")
      onOpenChange(false)
      onUserUpdated()
    } catch (error) {
      console.error("Error updating user:", error)
      toast.error(`Failed to update user: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information, role, and organization assignments.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Enter full name"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              placeholder="Enter email address"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">New Password (Optional)</Label>
            <Input
              id="password"
              type="password"
              {...form.register("password")}
              placeholder="Leave blank to keep current password"
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={form.watch("role")} onValueChange={(value) => form.setValue("role", value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.role && (
              <p className="text-sm text-destructive">{form.formState.errors.role.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="organizationId">Organization</Label>
            <Select value={form.watch("organizationId") || "none"} onValueChange={(value) => form.setValue("organizationId", value === "none" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No organization</SelectItem>
                {organizations.map((org: any) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspaceId">Workspace</Label>
            <Select value={form.watch("workspaceId") || "none"} onValueChange={(value) => form.setValue("workspaceId", value === "none" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select workspace" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No workspace</SelectItem>
                {workspaces.map((workspace: any) => (
                  <SelectItem key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
