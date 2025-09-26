import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const workspaceId = searchParams.get("workspaceId")

    // Build where clause based on available parameters
    let whereClause: any = {}
    
    if (projectId || workspaceId) {
      whereClause.OR = []
      if (projectId) whereClause.OR.push({ projectId: projectId })
      if (workspaceId) whereClause.OR.push({ workspaceId: workspaceId })
    } else {
      // If no specific project/workspace, get all custom fields for user's workspace/organization
      whereClause = {
        workspaceId: user.workspaceId || undefined
      }
    }

    // Get custom fields
    const customFields = await prisma.customField.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json(customFields)
  } catch (error) {
    console.error("Error fetching custom fields:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins and super admins can create custom fields
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { name, type, options, isRequired, projectId, workspaceId } = body

    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 })
    }

    if (!projectId && !workspaceId) {
      return NextResponse.json({ error: "Project ID or Workspace ID is required" }, { status: 400 })
    }

    const customField = await prisma.customField.create({
      data: {
        name,
        type,
        options: options ? JSON.stringify(options) : null,
        isRequired: isRequired || false,
        projectId: projectId || null,
        workspaceId: workspaceId || null
      }
    })

    return NextResponse.json(customField, { status: 201 })
  } catch (error) {
    console.error("Error creating custom field:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
