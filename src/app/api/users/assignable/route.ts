import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ✅ PRIVACY FIX: Only return users from same workspace
    if (!user.workspaceId) {
      return NextResponse.json({ error: "User not assigned to workspace" }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      where: {
        workspaceId: user.workspaceId
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
