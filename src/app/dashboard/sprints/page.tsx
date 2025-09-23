"use client"

import { useAuth } from "@/hooks/use-auth"
import { SprintBoard } from "@/components/sprints/sprint-board"

export default function SprintsPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }
  const handleCreateSprint = () => {
    console.log("Creating new sprint...")
    // In a real app, this would open a create sprint dialog
  }

  const handleStartSprint = (sprintId: string) => {
    console.log(`Starting sprint: ${sprintId}`)
    // In a real app, this would update the sprint status
  }

  const handleCompleteSprint = (sprintId: string) => {
    console.log(`Completing sprint: ${sprintId}`)
    // In a real app, this would update the sprint status and generate reports
  }

  return (
    <div className="space-y-6">
      <SprintBoard
        onCreateSprint={handleCreateSprint}
        onStartSprint={handleStartSprint}
        onCompleteSprint={handleCompleteSprint}
      />
    </div>
  )
}
