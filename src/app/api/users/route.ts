import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get("workspaceId")

    // If workspaceId is provided, fetch users from that workspace (for task assignment, etc.)
    if (workspaceId) {
      // Verify user has access to this workspace
      const hasAccess = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: workspaceId,
          userId: user.id
        }
      })

      if (!hasAccess && user.workspaceId !== workspaceId) {
        return NextResponse.json({ error: "Access denied to this workspace" }, { status: 403 })
      }

      // Fetch all users who are members of this workspace
      const workspaceMembers = await prisma.workspaceMember.findMany({
        where: {
          workspaceId: workspaceId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            }
          }
        }
      })

      // Also include users whose primary workspace is this one
      const primaryWorkspaceUsers = await prisma.user.findMany({
        where: {
          workspaceId: workspaceId
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        }
      })

      // Combine and deduplicate users
      const allUsers = [
        ...workspaceMembers.map(wm => wm.user),
        ...primaryWorkspaceUsers
      ]

      const uniqueUsers = Array.from(
        new Map(allUsers.map(u => [u.id, u])).values()
      )

      return NextResponse.json(uniqueUsers)
    }

    // Original admin-only behavior for listing all workspace users
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // ✅ PRIVACY FIX: Only return users from the same workspace
    if (!user.workspaceId) {
      return NextResponse.json({ error: "User not assigned to workspace" }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      where: {
        // Only users from the same workspace
        workspaceId: user.workspaceId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        workspaceId: true,
        createdAt: true,
        workspace: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            projects: true,
            createdTasks: true,
            assignedTasks: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can create users
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, password, role, workspaceId } = body

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    // ✅ PRIVACY FIX: Admin can only create users in their own workspace
    const targetWorkspaceId = workspaceId || user.workspaceId
    
    if (!targetWorkspaceId) {
      return NextResponse.json({ error: "Workspace is required" }, { status: 400 })
    }

    if (targetWorkspaceId !== user.workspaceId) {
      return NextResponse.json({ error: "Cannot create users in other workspaces" }, { status: 403 })
    }

    // Verify workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: targetWorkspaceId }
    })
    if (!workspace) {
      return NextResponse.json({ error: "Invalid workspace" }, { status: 400 })
    }

    // Validate role
    if (role && !["MEMBER", "ADMIN", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user and WorkspaceMember in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      // Create user
      const createdUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: role || "MEMBER",
          workspaceId: targetWorkspaceId
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          workspaceId: true,
          createdAt: true,
          workspace: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      // Create WorkspaceMember record
      await tx.workspaceMember.create({
        data: {
          userId: createdUser.id,
          workspaceId: targetWorkspaceId,
          role: role || "MEMBER" // Same role as User.role
        }
      })

      // Create activity log
      await tx.activity.create({
        data: {
          userId: user.id,
          type: 'user_created',
          title: 'User Created',
          message: `User "${createdUser.name}" was created by ${user.name}`
        }
      })

      return createdUser
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}