import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get users that can be assigned to tasks (same workspace only for proper isolation)
    const users = await prisma.user.findMany({
      where: {
        workspaceId: user.workspaceId,
        organizationId: user.organizationId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching assignable users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
