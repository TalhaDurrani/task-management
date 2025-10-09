import { NextRequest, NextResponse } from "next/server"
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

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    const workflows = await prisma.workflow.findMany({
      where: {
        projectId,
        userId: user.id
      },
      orderBy: { updatedAt: "desc" }
    })

    // Parse columns JSON for each workflow
    const workflowsWithParsedColumns = workflows.map(workflow => ({
      ...workflow,
      columns: JSON.parse(workflow.columns as string)
    }))

    return NextResponse.json(workflowsWithParsedColumns)
  } catch (error) {
    console.error("Error fetching workflows:", error)
    return NextResponse.json({ error: "Failed to fetch workflows" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, name, columns, isDefault } = await request.json()

    if (!projectId || !name || !columns) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // If setting as default, remove default flag from other workflows
    if (isDefault) {
      await prisma.workflow.updateMany({
        where: {
          projectId,
          userId: user.id,
          isDefault: true
        },
        data: { isDefault: false }
      })
    }

    const workflow = await prisma.workflow.create({
      data: {
        projectId,
        userId: user.id,
        name,
        columns: JSON.stringify(columns),
        isDefault: isDefault || false
      }
    })

    return NextResponse.json({
      ...workflow,
      columns: JSON.parse(workflow.columns as string)
    })
  } catch (error) {
    console.error("Error creating workflow:", error)
    return NextResponse.json({ error: "Failed to create workflow" }, { status: 500 })
  }
}
