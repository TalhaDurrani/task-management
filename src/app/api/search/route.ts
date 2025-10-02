import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const type = searchParams.get("type") || "all" // all, tasks, projects, users
    const limit = parseInt(searchParams.get("limit") || "10")

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] })
    }

    const searchTerm = query.trim().toLowerCase()
    const results: any = {
      tasks: [],
      projects: [],
      users: []
    }

    // Search tasks
    if (type === "all" || type === "tasks") {
      const tasks = await prisma.task.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
            { label: { contains: searchTerm, mode: "insensitive" } }
          ],
          project: {
            OR: [
              { userId: user.id },
              { createdBy: user.id },
              { 
                workspace: {
                  users: {
                    some: { id: user.id }
                  }
                }
              }
            ]
          }
        },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              description: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        take: limit,
        orderBy: {
          createdAt: "desc"
        }
      })

      results.tasks = tasks.map(task => ({
        id: task.id,
        type: "task",
        title: task.title,
        description: task.description,
        status: task.status,
        project: task.project,
        assignee: task.user,
        createdAt: task.createdAt,
        url: `/dashboard/projects/${task.projectId}/tasks`
      }))
    }

    // Search projects
    if (type === "all" || type === "projects") {
      const projects = await prisma.project.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
            { projectName: { contains: searchTerm, mode: "insensitive" } }
          ],
          OR: [
            { userId: user.id },
            { createdBy: user.id },
            { 
              workspace: {
                users: {
                  some: { id: user.id }
                }
              }
            }
          ]
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              tasks: true
            }
          }
        },
        take: limit,
        orderBy: {
          createdAt: "desc"
        }
      })

      results.projects = projects.map(project => ({
        id: project.id,
        type: "project",
        title: project.title,
        description: project.description,
        projectName: project.projectName,
        owner: project.user,
        taskCount: project._count.tasks,
        createdAt: project.createdAt,
        url: `/dashboard/projects/${project.id}`
      }))
    }

    // Search users (only if user is admin or super admin)
    if ((type === "all" || type === "users") && (user.role === "ADMIN" || user.role === "ADMIN")) {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { email: { contains: searchTerm, mode: "insensitive" } }
          ],
          // Only show users from the same organization for regular admins
          ...(user.role === "ADMIN" ? {
            } : {})
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true
            }
          },
          workspace: {
            select: {
              id: true,
              name: true
            }
          }
        },
        take: limit,
        orderBy: {
          createdAt: "desc"
        }
      })

      results.users = users.map(user => ({
        id: user.id,
        type: "user",
        title: user.name,
        description: user.email,
        role: user.role,
        organization: user.organization,
        workspace: user.workspace,
        createdAt: user.createdAt,
        url: `/dashboard/admin/users`
      }))
    }

    // Combine and sort results by relevance
    const allResults = [
      ...results.tasks,
      ...results.projects,
      ...results.users
    ].sort((a, b) => {
      // Prioritize exact matches in title
      const aTitleMatch = a.title.toLowerCase().includes(searchTerm)
      const bTitleMatch = b.title.toLowerCase().includes(searchTerm)
      
      if (aTitleMatch && !bTitleMatch) return -1
      if (!aTitleMatch && bTitleMatch) return 1
      
      // Then sort by creation date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return NextResponse.json({
      query: searchTerm,
      results: allResults.slice(0, limit),
      counts: {
        tasks: results.tasks.length,
        projects: results.projects.length,
        users: results.users.length,
        total: allResults.length
      }
    })

  } catch (error) {
    console.error("Error searching:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
