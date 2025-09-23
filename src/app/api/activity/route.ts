import { type NextRequest, NextResponse } from "next/server"
import { ActivityService } from "@/services/activityService"
import { AuthService } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const limit = parseInt(searchParams.get("limit") || "50")

    let activities

    if (projectId && projectId !== "all") {
      activities = await ActivityService.getProjectActivities(projectId, user.id, limit)
    } else {
      activities = await ActivityService.getActivities(user.id, limit)
    }

    return NextResponse.json(activities)
  } catch (error) {
    console.error("Error fetching activities:", error)
    if (error instanceof Error && error.message === 'Project not found or access denied') {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}