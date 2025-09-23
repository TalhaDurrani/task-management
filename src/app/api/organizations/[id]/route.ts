import { type NextRequest, NextResponse } from "next/server"
import { OrganizationService } from "@/services/organizationService"
import { AuthService } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const organization = await OrganizationService.getOrganization(params.id, user.id)
    return NextResponse.json(organization)
  } catch (error) {
    console.error("Error fetching organization:", error)
    if (error instanceof Error && error.message === 'Access denied') {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Organization not found') {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const organization = await OrganizationService.updateOrganization(params.id, body, user.id)
    
    return NextResponse.json(organization)
  } catch (error) {
    console.error("Error updating organization:", error)
    if (error instanceof Error && error.message === 'Access denied') {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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

    const result = await OrganizationService.deleteOrganization(params.id, user.id)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error deleting organization:", error)
    if (error instanceof Error && error.message === 'Access denied') {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
