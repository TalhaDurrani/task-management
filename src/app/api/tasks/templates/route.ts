import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { prisma } from "@/lib/db"

/**
 * Task Templates API - Jira/ClickUp-like task templates
 * 
 * Features:
 * - Pre-configured task templates with default values
 * - Custom fields pre-filled
 * - Quick task creation from templates
 * - Project-specific or global templates
 */

// GET /api/tasks/templates - Get all task templates
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

    let whereClause: any = {
      workspaceId: user.workspaceId
    }

    if (projectId) {
      whereClause.OR = [
        { projectId: projectId },
        { projectId: null } // Include global templates
      ]
    }

    const templates = await prisma.taskTemplate.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
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
      templates,
      count: templates.length
    })
  } catch (error) {
    console.error("Error fetching task templates:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/tasks/templates - Create a new task template
export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    if (!user.workspaceId) {
      return NextResponse.json({ error: "User not assigned to workspace" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, type, priority, projectId, templateData } = body

    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 })
    }

    // Validate templateData is valid JSON
    let parsedTemplateData = {}
    if (templateData) {
      try {
        parsedTemplateData = typeof templateData === 'string' 
          ? JSON.parse(templateData) 
          : templateData
      } catch (e) {
        return NextResponse.json({ error: "Invalid template data format" }, { status: 400 })
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

    const template = await prisma.taskTemplate.create({
      data: {
        name,
        description,
        type,
        priority: priority || 'MEDIUM',
        workspaceId: user.workspaceId,
        projectId: projectId || null,
        templateData: JSON.stringify(parsedTemplateData)
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

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error("Error creating task template:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
