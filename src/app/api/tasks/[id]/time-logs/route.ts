import { type NextRequest, NextResponse } from "next/server"
import { TimeLogService } from "@/services/timeLogService"
import { AuthService } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { hoursSpent, description } = body

    if (!hoursSpent || hoursSpent <= 0) {
      return NextResponse.json({ error: "Hours spent must be greater than 0" }, { status: 400 })
    }

    const timeLog = await TimeLogService.createTimeLog({
      taskId: params.id,
      hoursSpent,
      description: description || undefined
    }, user.id)

    return NextResponse.json(timeLog, { status: 201 })
  } catch (error) {
    console.error("Error logging time:", error)
    if (error instanceof Error && error.message === 'Task not found or access denied') {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
