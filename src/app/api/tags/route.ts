import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { prisma } from "@/lib/db"

// GET - Fetch all tags for a workspace
export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get("workspaceId")

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 })
    }

    const tags = await prisma.tag.findMany({
      where: { workspaceId },
      orderBy: { name: "asc" }
    })

    return NextResponse.json(tags)
  } catch (error) {
    console.error("Error fetching tags:", error)
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 })
  }
}

// POST - Create a new tag
export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, color, workspaceId } = body

    if (!name || !workspaceId) {
      return NextResponse.json(
        { error: "Name and workspace ID are required" },
        { status: 400 }
      )
    }

    // Check if tag with same name already exists in workspace
    const existing = await prisma.tag.findUnique({
      where: {
        name_workspaceId: {
          name,
          workspaceId
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: "Tag with this name already exists in this workspace" },
        { status: 409 }
      )
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        color: color || "#6B7280",
        workspaceId
      }
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error("Error creating tag:", error)
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 })
  }
}

// PUT - Update a tag
export async function PUT(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, color } = body

    if (!id || !name) {
      return NextResponse.json(
        { error: "ID and name are required" },
        { status: 400 }
      )
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: {
        name,
        color: color || "#6B7280"
      }
    })

    return NextResponse.json(tag)
  } catch (error) {
    console.error("Error updating tag:", error)
    return NextResponse.json({ error: "Failed to update tag" }, { status: 500 })
  }
}

// DELETE - Delete a tag
export async function DELETE(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Tag ID is required" }, { status: 400 })
    }

    await prisma.tag.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting tag:", error)
    return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 })
  }
}
