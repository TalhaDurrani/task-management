import { NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"

/**
 * GET /api/auth/me - Get current authenticated user
 * Returns user info including workspace assignment
 */
export async function GET() {
  try {
    const user = await AuthService.getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      workspaceId: user.workspaceId,
      workspace: user.workspace,
      ownedWorkspaces: user.ownedWorkspaces
    })
  } catch (error) {
    console.error("Error getting current user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
