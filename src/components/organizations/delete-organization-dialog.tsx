"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface Organization {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

interface DeleteOrganizationDialogProps {
  organization: Organization
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteOrganizationDialog({ organization, open, onOpenChange }: DeleteOrganizationDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success("Organization deleted successfully")
        onOpenChange(false)
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete organization")
      }
    } catch (error) {
      console.error('Error deleting organization:', error)
      toast.error("Failed to delete organization")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Organization</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{organization.name}"? This action cannot be undone.
            All workspaces, projects, and related data will be permanently deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading ? "Deleting..." : "Delete Organization"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
