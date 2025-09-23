"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface Organization {
  id: string
  name: string
}

interface CreateWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateWorkspaceDialog({ open, onOpenChange }: CreateWorkspaceDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [organizationId, setOrganizationId] = useState("")
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingOrgs, setLoadingOrgs] = useState(false)

  useEffect(() => {
    if (open) {
      loadOrganizations()
    }
  }, [open])

  const loadOrganizations = async () => {
    setLoadingOrgs(true)
    try {
      const response = await fetch('/api/organizations')
      if (response.ok) {
        const orgs = await response.json()
        setOrganizations(orgs)
      }
    } catch (error) {
      console.error('Error loading organizations:', error)
    } finally {
      setLoadingOrgs(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !organizationId) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          organizationId,
        }),
      })

      if (response.ok) {
        toast.success("Workspace created successfully")
        setName("")
        setDescription("")
        setOrganizationId("")
        onOpenChange(false)
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to create workspace")
      }
    } catch (error) {
      console.error('Error creating workspace:', error)
      toast.error("Failed to create workspace")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
          <DialogDescription>
            Create a new workspace within an organization to manage projects.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="organization">Organization *</Label>
              <Select value={organizationId} onValueChange={setOrganizationId} disabled={loadingOrgs}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingOrgs ? "Loading organizations..." : "Select organization"} />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter workspace name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter workspace description (optional)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim() || !organizationId}>
              {isLoading ? "Creating..." : "Create Workspace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
