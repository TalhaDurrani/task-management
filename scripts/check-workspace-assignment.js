const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAndFixWorkspaceAssignment() {
  try {
    console.log('🔍 Checking workspace assignments...\n')

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        workspaceId: true,
        role: true
      }
    })

    console.log(`Found ${users.length} users:\n`)

    // Check for users without workspace
    const usersWithoutWorkspace = users.filter(u => !u.workspaceId)
    
    if (usersWithoutWorkspace.length > 0) {
      console.log('❌ Users WITHOUT workspace assignment:')
      usersWithoutWorkspace.forEach(u => {
        console.log(`   - ${u.email} (${u.name}) - ID: ${u.id}`)
      })
      console.log('')
    }

    // Check for users with workspace
    const usersWithWorkspace = users.filter(u => u.workspaceId)
    
    if (usersWithWorkspace.length > 0) {
      console.log('✅ Users WITH workspace assignment:')
      usersWithWorkspace.forEach(u => {
        console.log(`   - ${u.email} (${u.name}) - Workspace: ${u.workspaceId}`)
      })
      console.log('')
    }

    // Get all workspaces
    const workspaces = await prisma.workspace.findMany({
      select: {
        id: true,
        name: true,
        ownerId: true,
        joinCode: true
      }
    })

    console.log(`\nFound ${workspaces.length} workspaces:`)
    workspaces.forEach(w => {
      console.log(`   - ${w.name} (ID: ${w.id})`)
      console.log(`     Join Code: ${w.joinCode}`)
      console.log(`     Owner ID: ${w.ownerId}`)
    })

    // Auto-fix option
    if (usersWithoutWorkspace.length > 0 && workspaces.length > 0) {
      console.log('\n\n🔧 AUTO-FIX OPTIONS:\n')
      
      // Option 1: Create a new workspace for first user
      if (usersWithoutWorkspace.length > 0) {
        const firstUser = usersWithoutWorkspace[0]
        console.log(`Option 1: Create new workspace for ${firstUser.email}`)
        console.log(`   Run: node scripts/create-workspace.js "${firstUser.email}" "My Workspace"\n`)
      }

      // Option 2: Assign to existing workspace
      if (workspaces.length > 0) {
        const firstWorkspace = workspaces[0]
        console.log(`Option 2: Assign users to existing workspace "${firstWorkspace.name}"`)
        console.log(`   SQL Query:`)
        usersWithoutWorkspace.forEach(u => {
          console.log(`   
   -- Assign ${u.email} to ${firstWorkspace.name}
   UPDATE "User" SET "workspaceId" = '${firstWorkspace.id}' WHERE id = '${u.id}';
   INSERT INTO workspace_members (id, "userId", "workspaceId", role, "joinedAt")
   VALUES (gen_random_uuid(), '${u.id}', '${firstWorkspace.id}', 'ADMIN', NOW())
   ON CONFLICT DO NOTHING;
`)
        })
      }

      // Option 3: Quick fix for current user
      console.log(`\nOption 3: Quick Fix (Recommended)`)
      console.log(`   1. Login to your app`)
      console.log(`   2. Go to Workspaces page`)
      console.log(`   3. Click "Create Workspace"`)
      console.log(`   4. Enter workspace name and create`)
      console.log(`   5. You'll automatically be assigned as owner\n`)
    }

    // Check WorkspaceMember records
    console.log('\n📋 Checking WorkspaceMember records...')
    const workspaceMembers = await prisma.workspaceMember.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        },
        workspace: {
          select: {
            name: true
          }
        }
      }
    })

    console.log(`Found ${workspaceMembers.length} workspace memberships:`)
    workspaceMembers.forEach(wm => {
      console.log(`   - ${wm.user.email} in "${wm.workspace.name}" as ${wm.role}`)
    })

    // Check for missing WorkspaceMember records
    const usersWithWorkspaceButNoMembership = []
    for (const user of usersWithWorkspace) {
      const membership = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: user.id,
            workspaceId: user.workspaceId
          }
        }
      })
      if (!membership) {
        usersWithWorkspaceButNoMembership.push(user)
      }
    }

    if (usersWithWorkspaceButNoMembership.length > 0) {
      console.log('\n⚠️  Users with workspaceId but NO WorkspaceMember record:')
      usersWithWorkspaceButNoMembership.forEach(u => {
        console.log(`   - ${u.email} (${u.name})`)
      })
      console.log('\n   Fix with SQL:')
      usersWithWorkspaceButNoMembership.forEach(u => {
        console.log(`   INSERT INTO workspace_members (id, "userId", "workspaceId", role, "joinedAt")`)
        console.log(`   VALUES (gen_random_uuid(), '${u.id}', '${u.workspaceId}', 'ADMIN', NOW());`)
      })
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAndFixWorkspaceAssignment()
