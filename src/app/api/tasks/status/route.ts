import { NextRequest, NextResponse } from 'next/server'
import { TaskService } from "@/services/taskService"
import { StatusService } from "@/services/statusService"
import { AuthService } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Status } from '@prisma/client'

export async function PATCH(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { 
      taskId, 
      status, 
      customStatus, 
      force 
    } = await request.json()

    // Validate input
    if (!taskId || !status) {
      return NextResponse.json(
        { error: "Task ID and status are required" }, 
        { status: 400 }
      )
    }

    const updatedTask = await TaskService.updateTaskStatus(
      taskId, 
      status as Status, 
      user.id, 
      { 
        customStatus, 
        force 
      }
    )

    return NextResponse.json(updatedTask)
  } catch (error: any) {
    console.error('Status update error:', error)
    return NextResponse.json(
      { error: error.message }, 
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    // Default statuses with categories
    const defaultStatuses = [
      { name: 'TODO', category: 'BACKLOG', color: '#GRAY' },
      { name: 'IN_PROGRESS', category: 'IN_PROGRESS', color: '#BLUE' },
      { name: 'DONE', category: 'COMPLETED', color: '#GREEN' }
    ]

    if (!workspaceId) {
      // Return default statuses if no workspace provided
      return NextResponse.json(defaultStatuses)
    }

    // If workspace provided, include custom statuses
    let customStatusList: Array<{name: string, color: string, category: string}> = []
    try {
      // First, try to get from CustomStatus table
      const dbCustomStatuses = await prisma.$queryRaw`
        SELECT name, color, category FROM custom_statuses WHERE "workspaceId" = ${workspaceId}
      ` as Array<{name: string, color: string | null, category: string}>

      customStatusList = dbCustomStatuses.map((cs) => ({
        name: cs.name,
        color: cs.color || '#34D399',
        category: cs.category
      }))
    } catch (error) {
      console.log('CustomStatus table not available, falling back to task custom statuses:', error)
      
      // Fallback: Get unique custom statuses from tasks
      const customStatuses = await prisma.task.findMany({
        where: {
          project: { workspaceId },
          customStatus: { not: null }
        },
        select: {
          customStatus: true,
          statusCategory: true
        },
        distinct: ['customStatus', 'statusCategory']
      })

      customStatusList = customStatuses.map((status: any) => ({
        name: status.customStatus,
        category: status.statusCategory,
        color: '#34D399' // Default color for custom status
      }))
    }

    const allStatuses = [...defaultStatuses, ...customStatusList]

    return NextResponse.json(allStatuses)
  } catch (error: any) {
    console.error('Fetching statuses error:', error)
    return NextResponse.json(
      { error: error.message || "Internal server error" }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, category, color } = await request.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Status name is required" }, 
        { status: 400 }
      )
    }

    if (!category) {
      return NextResponse.json(
        { error: "Status category is required (BACKLOG, IN_PROGRESS, COMPLETED, ON_HOLD)" }, 
        { status: 400 }
      )
    }

    const statusName = name.trim().toUpperCase()

    // Check if status already exists in default statuses
    const defaultStatuses = ['TODO', 'IN_PROGRESS', 'DONE']
    if (defaultStatuses.includes(statusName)) {
      return NextResponse.json(
        { error: "This status already exists as a default status" }, 
        { status: 400 }
      )
    }

    // Check if custom status already exists in this workspace
    if (user.workspaceId) {
      const existingTask = await prisma.task.findFirst({
        where: {
          project: {
            workspaceId: user.workspaceId
          },
          customStatus: {
            mode: 'insensitive',
            equals: statusName
          }
        }
      })

      if (existingTask) {
        return NextResponse.json(
          { error: "This custom status already exists in your workspace" }, 
          { status: 400 }
        )
      }
    }

    // Return the new status (we don't store statuses separately, they're just strings in tasks)
    const newStatus = {
      name: statusName,
      category: category,
      color: color || '#34D399'
    }

    return NextResponse.json(newStatus, { status: 201 })
  } catch (error: any) {
    console.error('Error creating custom status:', error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!user.workspaceId) {
      return NextResponse.json({ error: "User not assigned to workspace" }, { status: 403 })
    }

    const body = await request.json()
    const { id, name, color, category } = body

    if (!id) {
      return NextResponse.json({ error: "Status ID is required" }, { status: 400 })
    }

    console.log(`🔧 Updating custom status: ${id} for workspace: ${user.workspaceId}`)
    const updatedStatus = await StatusService.updateCustomStatus(id, user.workspaceId, { name, color, category })
    console.log(`✅ Custom status updated: ${updatedStatus.name}`)
    
    return NextResponse.json(updatedStatus)
  } catch (error: any) {
    console.error("Error updating custom status:", error)
    if (error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!user.workspaceId) {
      return NextResponse.json({ error: "User not assigned to workspace" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Status ID is required" }, { status: 400 })
    }

    console.log(`🗑️ Deleting custom status: ${id} for workspace: ${user.workspaceId}`)
    const result = await StatusService.deleteCustomStatus(id, user.workspaceId)
    console.log(`✅ Custom status deleted successfully`)
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error deleting custom status:", error)
    if (error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    if (error.message.includes('being used')) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
