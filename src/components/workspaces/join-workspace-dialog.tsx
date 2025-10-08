"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface JoinWorkspaceDialogProps {
  children?: React.ReactNode
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function JoinWorkspaceDialog({ children, onSuccess, open: controlledOpen, onOpenChange }: JoinWorkspaceDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  const [isLoading, setIsLoading] = useState(false)
  const [joinCode, setJoinCode] = useState("")
  const router = useRouter()

  const handleJoin = async () => {
    if (!joinCode.trim()) {
      toast.error("Please enter a workspace code.")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/workspaces/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(`Successfully joined workspace: ${result.workspace.name}`)
        setOpen(false)
        setJoinCode("")
        
        // Call the callback to refresh workspace list if provided
        if (onSuccess) {
          onSuccess()
        }
        
        // Navigate to workspaces page
        router.push('/dashboard/workspaces')
      } else {
        toast.error(result.error || "Failed to join workspace.")
      }
    } catch (error) {
      console.error("Error joining workspace:", error)
      toast.error("An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join a Workspace</DialogTitle>
          <DialogDescription>
            Enter the unique code you received to join a workspace.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Input
              id="joinCode"
              placeholder="e.g., ABCD-EFGH"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="col-span-4"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleJoin} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Join Workspace
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
