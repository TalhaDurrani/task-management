import { type NextRequest, NextResponse } from "next/server"
import { TaskService } from "@/services/taskService"
import { AuthService } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`🔍 Fetching assigned tasks for user: ${user.id}`)
    const tasks = await TaskService.getUserAssignedTasks(user.id)
    console.log(`📊 Found ${tasks.length} assigned tasks`)
    
    // Log tasks for debugging
    if (tasks.length > 0) {
      console.log(`📋 Sample assigned task: ${tasks[0].title} (${tasks[0].id})`)
    }
    
    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Error fetching assigned tasks:", error)
    if (error instanceof Error && error.message === 'User not assigned to workspace or organization') {
      return NextResponse.json({ error: "User not assigned to workspace" }, { status: 403 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
