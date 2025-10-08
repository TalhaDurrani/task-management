import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { prisma } from "@/lib/db"

// GET /api/custom-fields/[id] - Get a specific custom field
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!user.workspaceId) {
      return NextResponse.json({ error: "User not assigned to workspace" }, { status: 403 })
    }

    const customField = await prisma.customField.findFirst({
      where: {
        id: params.id,
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

    if (!customField) {
      return NextResponse.json({ error: "Custom field not found" }, { status: 404 })
    }

    return NextResponse.json(customField)
  } catch (error) {
    console.error("Error fetching custom field:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/custom-fields/[id] - Update a custom field
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify field belongs to user's workspace
    const existingField = await prisma.customField.findFirst({
      where: {
        id: params.id,
        workspaceId: user.workspaceId
      }
    })

    if (!existingField) {
      return NextResponse.json({ error: "Custom field not found" }, { status: 404 })
    }

    const body = await request.json()
    const { name, options, defaultValue, placeholder, isRequired, isGlobal, min, max, pattern } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (options !== undefined) updateData.options = options ? JSON.stringify(options) : null
    if (defaultValue !== undefined) updateData.defaultValue = defaultValue
    if (placeholder !== undefined) updateData.placeholder = placeholder
    if (isRequired !== undefined) updateData.isRequired = isRequired
    if (isGlobal !== undefined) updateData.isGlobal = isGlobal
    if (min !== undefined) updateData.min = min !== null ? parseFloat(min) : null
    if (max !== undefined) updateData.max = max !== null ? parseFloat(max) : null
    if (pattern !== undefined) updateData.pattern = pattern

    const updatedField = await prisma.customField.update({
      where: { id: params.id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    return NextResponse.json(updatedField)
  } catch (error) {
    console.error("Error updating custom field:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/custom-fields/[id] - Delete a custom field
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify field belongs to user's workspace
    const existingField = await prisma.customField.findFirst({
      where: {
        id: params.id,
        workspaceId: user.workspaceId
      }
    })

    if (!existingField) {
      return NextResponse.json({ error: "Custom field not found" }, { status: 404 })
    }

    // Delete all task custom field values first (cascading should handle this, but explicit is safer)
    await prisma.taskCustomField.deleteMany({
      where: { customFieldId: params.id }
    })

    // Delete the custom field
    await prisma.customField.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true, message: "Custom field deleted successfully" })
  } catch (error) {
    console.error("Error deleting custom field:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
