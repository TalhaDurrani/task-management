import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { prisma } from "@/lib/db"

/**
 * Custom Field Management API - Jira/ClickUp-like custom fields
 * 
 * Features:
 * - 12 field types (TEXT, NUMBER, DROPDOWN, MULTI_SELECT, BOOLEAN, DATE, USER, EMAIL, URL, TEXTAREA, CHECKBOX, RATING)
 * - Field validation (required, min/max, pattern)
 * - Project-specific or global fields
 * - Field templates for quick setup
 */

// GET /api/custom-fields - Get all custom fields for workspace/project
export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!user.workspaceId) {
      return NextResponse.json({ error: "User not assigned to workspace" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const includeGlobal = searchParams.get("includeGlobal") === "true"

    // Build where clause
    let whereClause: any = {
      workspaceId: user.workspaceId
    }

    if (projectId) {
      // Get project-specific fields and optionally global fields
      if (includeGlobal) {
        whereClause = {
          OR: [
            { projectId: projectId, workspaceId: user.workspaceId },
            { projectId: null, workspaceId: user.workspaceId, isGlobal: true }
          ]
        }
      } else {
        whereClause.projectId = projectId
      }
    } else if (includeGlobal) {
      // Only global fields
      whereClause.isGlobal = true
      whereClause.projectId = null
    }

    const customFields = await prisma.customField.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'asc'
      },
      include: {
        project: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    return NextResponse.json({
      fields: customFields,
      count: customFields.length
    })
  } catch (error) {
    console.error("Error fetching custom fields:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/custom-fields - Create a new custom field
export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can create custom fields
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    if (!user.workspaceId) {
      return NextResponse.json({ error: "User not assigned to workspace" }, { status: 403 })
    }

    const body = await request.json()
    const { 
      name, 
      type, 
      description,
      options, 
      defaultValue,
      placeholder,
      isRequired, 
      isGlobal,
      min,
      max,
      pattern,
      projectId 
    } = body

    // Validation
    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 })
    }

    const validTypes = [
      'TEXT', 'NUMBER', 'DROPDOWN', 'MULTI_SELECT', 'BOOLEAN', 
      'DATE', 'USER', 'EMAIL', 'URL', 'TEXTAREA', 'CHECKBOX', 'RATING'
    ]
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid field type" }, { status: 400 })
    }

    // Validate options for DROPDOWN, MULTI_SELECT, CHECKBOX
    if (['DROPDOWN', 'MULTI_SELECT', 'CHECKBOX'].includes(type)) {
      if (!options || (Array.isArray(options) && options.length === 0)) {
        return NextResponse.json({ 
          error: `Options are required for ${type} field type` 
        }, { status: 400 })
      }
    }

    // Validate min/max for NUMBER and RATING
    if (['NUMBER', 'RATING'].includes(type)) {
      if (min !== undefined && max !== undefined && min > max) {
        return NextResponse.json({ 
          error: "Min value cannot be greater than max value" 
        }, { status: 400 })
      }
    }

    // If projectId provided, verify it belongs to user's workspace
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          workspaceId: user.workspaceId
        }
      })
      
      if (!project) {
        return NextResponse.json({ 
          error: "Project not found or access denied" 
        }, { status: 404 })
      }
    }

    // Create custom field
    const customField = await prisma.customField.create({
      data: {
        name,
        type,
        description,
        options: options ? JSON.stringify(options) : null,
        defaultValue,
        placeholder,
        isRequired: isRequired || false,
        isGlobal: isGlobal || false,
        min: min !== undefined ? parseFloat(min) : null,
        max: max !== undefined ? parseFloat(max) : null,
        pattern,
        projectId: projectId || null,
        workspaceId: user.workspaceId
      },
      include: {
        project: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    return NextResponse.json(customField, { status: 201 })
  } catch (error) {
    console.error("Error creating custom field:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
