"use client"

import { useAuth } from "@/hooks/use-auth"
import { TimeTracker } from "@/components/time/time-tracker"

export default function TimeTrackingPage() {
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
  const handleStartTimer = (taskId: string) => {
    console.log(`Starting timer for task: ${taskId}`)
    // In a real app, this would start the timer
  }

  const handleStopTimer = (entryId: string) => {
    console.log(`Stopping timer for entry: ${entryId}`)
    // In a real app, this would stop the timer and save the entry
  }

  const handlePauseTimer = (entryId: string) => {
    console.log(`Pausing timer for entry: ${entryId}`)
    // In a real app, this would pause the timer
  }

  const handleResumeTimer = (entryId: string) => {
    console.log(`Resuming timer for entry: ${entryId}`)
    // In a real app, this would resume the timer
  }

  const handleEditEntry = (entry: any) => {
    console.log("Editing time entry:", entry)
    // In a real app, this would open an edit dialog
  }

  const handleDeleteEntry = (entryId: string) => {
    console.log("Deleting time entry:", entryId)
    // In a real app, this would show confirmation and delete the entry
  }

  return (
    <div className="space-y-6">
      <TimeTracker
        onStartTimer={handleStartTimer}
        onStopTimer={handleStopTimer}
        onPauseTimer={handlePauseTimer}
        onResumeTimer={handleResumeTimer}
        onEditEntry={handleEditEntry}
        onDeleteEntry={handleDeleteEntry}
      />
    </div>
  )
}
