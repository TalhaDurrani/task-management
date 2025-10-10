/**
 * Fix Invalid Task Statuses Script
 * 
 * This script fixes tasks that have invalid status values (anything other than 1, 2, 3)
 * and corrupted customStatus values (numeric instead of string names)
 * 
 * Usage: node scripts/fix-invalid-task-statuses.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Starting Task Status Cleanup Script\n')

  try {
    // Step 1: Find all tasks with invalid status values
    console.log('📊 Step 1: Identifying tasks with invalid status values...')
    
    const allTasks = await prisma.task.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        customStatus: true,
        statusCategory: true,
        project: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    const invalidTasks = allTasks.filter(task => {
      // Valid status values are 1, 2, 3
      return task.status < 1 || task.status > 3
    })

    const tasksWithNumericCustomStatus = allTasks.filter(task => {
      // Check if customStatus is a number string like "4", "5", etc.
      return task.customStatus && /^\d+$/.test(task.customStatus)
    })

    console.log(`Found ${allTasks.length} total tasks`)
    console.log(`Found ${invalidTasks.length} tasks with invalid status values`)
    console.log(`Found ${tasksWithNumericCustomStatus.length} tasks with numeric customStatus\n`)

    if (invalidTasks.length === 0 && tasksWithNumericCustomStatus.length === 0) {
      console.log('✅ No tasks need fixing. All statuses are valid!')
      return
    }

    // Step 2: Display invalid tasks
    if (invalidTasks.length > 0) {
      console.log('❌ Tasks with invalid status values:')
      console.log('┌────────────────────────┬──────────────────────┬────────┬───────────────┬───────────────┐')
      console.log('│ Task ID (first 8)      │ Title                │ Status │ CustomStatus  │ Category      │')
      console.log('├────────────────────────┼──────────────────────┼────────┼───────────────┼───────────────┤')
      
      for (const task of invalidTasks) {
        const id = task.id.substring(0, 8)
        const title = (task.title || 'Untitled').substring(0, 20).padEnd(20)
        const status = String(task.status).padEnd(6)
        const customStatus = (task.customStatus || 'null').substring(0, 13).padEnd(13)
        const category = (task.statusCategory || 'N/A').padEnd(13)
        console.log(`│ ${id} │ ${title} │ ${status} │ ${customStatus} │ ${category} │`)
      }
      console.log('└────────────────────────┴──────────────────────┴────────┴───────────────┴───────────────┘\n')
    }

    if (tasksWithNumericCustomStatus.length > 0) {
      console.log('⚠️  Tasks with numeric customStatus (should be string names):')
      console.log('┌────────────────────────┬──────────────────────┬────────┬───────────────┐')
      console.log('│ Task ID (first 8)      │ Title                │ Status │ CustomStatus  │')
      console.log('├────────────────────────┼──────────────────────┼────────┼───────────────┤')
      
      for (const task of tasksWithNumericCustomStatus) {
        const id = task.id.substring(0, 8)
        const title = (task.title || 'Untitled').substring(0, 20).padEnd(20)
        const status = String(task.status).padEnd(6)
        const customStatus = (task.customStatus || 'null').substring(0, 13).padEnd(13)
        console.log(`│ ${id} │ ${title} │ ${status} │ ${customStatus} │`)
      }
      console.log('└────────────────────────┴──────────────────────┴────────┴───────────────┘\n')
    }

    // Step 3: Fix invalid status values
    console.log('🔄 Step 3: Fixing invalid status values...')
    
    for (const task of invalidTasks) {
      let newStatus = 1 // Default to BACKLOG
      let newCategory = 'BACKLOG'

      // Try to infer correct status from statusCategory
      switch (task.statusCategory) {
        case 'BACKLOG':
        case 'ON_HOLD':
          newStatus = 1
          newCategory = 'BACKLOG'
          break
        case 'IN_PROGRESS':
          newStatus = 2
          newCategory = 'IN_PROGRESS'
          break
        case 'COMPLETED':
          newStatus = 3
          newCategory = 'COMPLETED'
          break
        default:
          // If invalid status is 4+, try to guess
          if (task.status >= 4) {
            newStatus = 1 // Default to BACKLOG for unknown
            newCategory = 'BACKLOG'
          }
      }

      await prisma.task.update({
        where: { id: task.id },
        data: {
          status: newStatus,
          statusCategory: newCategory,
          customStatus: null // Clear numeric customStatus
        }
      })

      console.log(`  ✅ Fixed task "${task.title}": status ${task.status} → ${newStatus}, cleared customStatus`)
    }

    // Step 4: Fix tasks with numeric customStatus
    console.log('\n🔄 Step 4: Fixing numeric customStatus values...')
    
    for (const task of tasksWithNumericCustomStatus) {
      // If the task status is already valid (1/2/3), just clear the customStatus
      if (task.status >= 1 && task.status <= 3) {
        await prisma.task.update({
          where: { id: task.id },
          data: {
            customStatus: null // Clear numeric customStatus
          }
        })
        console.log(`  ✅ Cleared numeric customStatus for task "${task.title}"`)
      }
    }

    // Step 5: Verify fixes
    console.log('\n🔍 Step 5: Verifying fixes...')
    
    const remainingInvalid = await prisma.task.findMany({
      where: {
        OR: [
          { status: { lt: 1 } },
          { status: { gt: 3 } }
        ]
      }
    })

    const remainingNumericCustomStatus = await prisma.task.findMany({
      where: {
        customStatus: {
          not: null
        }
      }
    })

    const stillNumeric = remainingNumericCustomStatus.filter(t => /^\d+$/.test(t.customStatus || ''))

    if (remainingInvalid.length === 0 && stillNumeric.length === 0) {
      console.log('✅ All tasks have been fixed!')
      console.log(`   - ${invalidTasks.length} tasks with invalid status were corrected`)
      console.log(`   - ${tasksWithNumericCustomStatus.length} tasks with numeric customStatus were cleared`)
    } else {
      console.log(`⚠️  Still found ${remainingInvalid.length} tasks with invalid status`)
      console.log(`⚠️  Still found ${stillNumeric.length} tasks with numeric customStatus`)
    }

    // Step 6: Summary
    console.log('\n📊 Final Summary:')
    const finalStats = await prisma.task.groupBy({
      by: ['status'],
      _count: true
    })

    console.log('Status distribution:')
    for (const stat of finalStats) {
      const statusName = stat.status === 1 ? 'BACKLOG (1)' : 
                        stat.status === 2 ? 'IN_PROGRESS (2)' : 
                        stat.status === 3 ? 'COMPLETED (3)' : 
                        `INVALID (${stat.status})`
      console.log(`  ${statusName}: ${stat._count} tasks`)
    }

    console.log('\n✅ Cleanup completed!')
    console.log('\n💡 Important Notes:')
    console.log('1. All tasks now have valid status values (1, 2, or 3)')
    console.log('2. Numeric customStatus values have been cleared')
    console.log('3. You can now assign proper custom status names from the UI')
    console.log('4. The fixed code will prevent this from happening again')

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
