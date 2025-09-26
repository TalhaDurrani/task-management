import { type NextRequest, NextResponse } from "next/server"
import { TypeService } from "@/services/typeService"
import { AuthService } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!user.workspaceId) {
      return NextResponse.json({ error: "User not assigned to workspace" }, { status: 403 })
    }

    console.log(`🔍 Fetching types for workspace: ${user.workspaceId}`)
    const types = await TypeService.getWorkspaceTypes(user.workspaceId)
    console.log(`📊 Found ${types.custom.length} custom types`)
    
    return NextResponse.json(types)
  } catch (error) {
    console.error("Error fetching types:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!user.workspaceId) {
      return NextResponse.json({ error: "User not assigned to workspace" }, { status: 403 })
    }

    const body = await request.json()
    const { name, color } = body

    if (!name) {
      return NextResponse.json({ error: "Type name is required" }, { status: 400 })
    }

    console.log(`🔧 Creating custom type: ${name} for workspace: ${user.workspaceId}`)
    const customType = await TypeService.createCustomType(user.workspaceId, { name, color })
    console.log(`✅ Custom type created: ${customType.name}`)
    
    return NextResponse.json(customType, { status: 201 })
  } catch (error) {
    console.error("Error creating custom type:", error)
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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
    const { id, name, color } = body

    if (!id) {
      return NextResponse.json({ error: "Type ID is required" }, { status: 400 })
    }

    console.log(`🔧 Updating custom type: ${id} for workspace: ${user.workspaceId}`)
    const updatedType = await TypeService.updateCustomType(id, user.workspaceId, { name, color })
    console.log(`✅ Custom type updated: ${updatedType.name}`)
    
    return NextResponse.json(updatedType)
  } catch (error) {
    console.error("Error updating custom type:", error)
    if (error instanceof Error && error.message.includes('not found')) {
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
      return NextResponse.json({ error: "Type ID is required" }, { status: 400 })
    }

    console.log(`🗑️ Deleting custom type: ${id} for workspace: ${user.workspaceId}`)
    const result = await TypeService.deleteCustomType(id, user.workspaceId)
    console.log(`✅ Custom type deleted successfully`)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error deleting custom type:", error)
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    if (error instanceof Error && error.message.includes('being used')) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
