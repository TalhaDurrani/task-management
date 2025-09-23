import { type NextRequest, NextResponse } from "next/server"
import { OrganizationService } from "@/services/organizationService"
import { AuthService } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const organizations = await OrganizationService.getOrganizations(user.id)
    return NextResponse.json(organizations)
  } catch (error) {
    console.error("Error fetching organizations:", error)
    if (error instanceof Error && error.message === 'Access denied') {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const organization = await OrganizationService.createOrganization(body, user.id)
    
    return NextResponse.json(organization, { status: 201 })
  } catch (error) {
    console.error("Error creating organization:", error)
    if (error instanceof Error && error.message === 'Only super admins can create organizations') {
      return NextResponse.json({ error: "Only super admins can create organizations" }, { status: 403 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
