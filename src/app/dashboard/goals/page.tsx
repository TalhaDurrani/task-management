"use client"

import { useAuth } from "@/hooks/use-auth"
import { GoalsBoard } from "@/components/goals/goals-board"

export default function GoalsPage() {
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
  const handleCreateGoal = () => {
    console.log("Creating new goal...")
    // In a real app, this would open a create goal dialog
  }

  const handleEditGoal = (goal: any) => {
    console.log("Editing goal:", goal)
    // In a real app, this would open an edit goal dialog
  }

  const handleDeleteGoal = (goalId: string) => {
    console.log("Deleting goal:", goalId)
    // In a real app, this would show confirmation and delete the goal
  }

  const handleUpdateKeyResult = (goalId: string, keyResultId: string, value: number) => {
    console.log(`Updating key result ${keyResultId} in goal ${goalId} to ${value}`)
    // In a real app, this would update the key result value
  }

  return (
    <div className="space-y-6">
      <GoalsBoard
        onCreateGoal={handleCreateGoal}
        onEditGoal={handleEditGoal}
        onDeleteGoal={handleDeleteGoal}
        onUpdateKeyResult={handleUpdateKeyResult}
      />
    </div>
  )
}
