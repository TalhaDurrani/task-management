import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { columns, name, isDefault } = await request.json()

    // Verify ownership
    const existingWorkflow = await prisma.workflow.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    if (!existingWorkflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
    }

    // If setting as default, remove default flag from other workflows
    if (isDefault) {
      await prisma.workflow.updateMany({
        where: {
          projectId: existingWorkflow.projectId,
          userId: user.id,
          isDefault: true,
          id: { not: params.id }
        },
        data: { isDefault: false }
      })
    }

    const updateData: any = {
      updatedAt: new Date()
    }

    if (columns) updateData.columns = JSON.stringify(columns)
    if (name) updateData.name = name
    if (isDefault !== undefined) updateData.isDefault = isDefault

    const workflow = await prisma.workflow.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json({
      ...workflow,
      columns: JSON.parse(workflow.columns as string)
    })
  } catch (error) {
    console.error("Error updating workflow:", error)
    return NextResponse.json({ error: "Failed to update workflow" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify ownership
    const existingWorkflow = await prisma.workflow.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    if (!existingWorkflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
    }

    await prisma.workflow.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting workflow:", error)
    return NextResponse.json({ error: "Failed to delete workflow" }, { status: 500 })
  }
}
