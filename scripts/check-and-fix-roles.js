#!/usr/bin/env node

/**
 * Role Fix Script
 * 
 * This script checks and fixes user roles in the database
 * Run with: node scripts/check-and-fix-roles.js
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking user roles...\n')

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        workspaceId: true,
      },
    })

    console.log(`Found ${users.length} users\n`)

    // Check for invalid roles
    const invalidRoles = users.filter(
      (user) => user.role !== 'ADMIN' && user.role !== 'MEMBER'
    )

    if (invalidRoles.length === 0) {
      console.log('✅ All users have valid roles (ADMIN or MEMBER)')
      console.log('\nCurrent distribution:')
      
      const admins = users.filter(u => u.role === 'ADMIN')
      const members = users.filter(u => u.role === 'MEMBER')
      
      console.log(`   👑 ADMIN:  ${admins.length}`)
      console.log(`   👤 MEMBER: ${members.length}`)
      
      console.log('\nUser Details:')
      users.forEach(user => {
        const roleIcon = user.role === 'ADMIN' ? '👑' : '👤'
        const workspace = user.workspaceId ? '✓' : '✗'
        console.log(`   ${roleIcon} ${user.name} (${user.email}) - ${user.role} [Workspace: ${workspace}]`)
      })
      
      return
    }

    console.log(`⚠️  Found ${invalidRoles.length} users with invalid roles:\n`)
    
    invalidRoles.forEach((user) => {
      console.log(`   ❌ ${user.name} (${user.email}) has role: "${user.role}"`)
    })

    console.log('\n🔧 Fixing invalid roles...\n')

    // Fix each invalid role
    for (const user of invalidRoles) {
      let newRole = 'MEMBER' // Default to MEMBER

      // If user's role was SUPER_ADMIN or has 'admin' in any case, make them ADMIN
      if (
        user.role === 'SUPER_ADMIN' ||
        user.role === 'ADMIN' ||
        user.role?.toLowerCase().includes('admin')
      ) {
        newRole = 'ADMIN'
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { role: newRole },
      })

      console.log(`   ✅ Updated ${user.name}: "${user.role}" → "${newRole}"`)
    }

    console.log('\n✅ All roles fixed!')
    
    // Show final distribution
    const finalUsers = await prisma.user.findMany({
      select: {
        name: true,
        email: true,
        role: true,
      },
    })
    
    console.log('\n📊 Final distribution:')
    const admins = finalUsers.filter(u => u.role === 'ADMIN')
    const members = finalUsers.filter(u => u.role === 'MEMBER')
    
    console.log(`   👑 ADMIN:  ${admins.length}`)
    console.log(`   👤 MEMBER: ${members.length}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
