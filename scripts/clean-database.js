/**
 * Database Cleanup Script
 * 
 * This script will DELETE ALL DATA from your database.
 * Use with caution - this action cannot be undone!
 * 
 * Usage:
 *   node scripts/clean-database.js
 * 
 * Or if you want to reset and reseed:
 *   npm run db:reset
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function cleanDatabase() {
  console.log('🗑️  Starting database cleanup...\n')

  try {
    // Delete in order to respect foreign key constraints
    // Start with child tables first, then parent tables

    console.log('Deleting workflows...')
    await prisma.workflow.deleteMany({})

    console.log('Deleting task tags...')
    await prisma.taskTag.deleteMany({})

    console.log('Deleting tags...')
    await prisma.tag.deleteMany({})

    console.log('Deleting task custom fields...')
    await prisma.taskCustomField.deleteMany({})

    console.log('Deleting custom fields...')
    await prisma.customField.deleteMany({})

    console.log('Deleting attachments...')
    await prisma.attachment.deleteMany({})

    console.log('Deleting task assignees...')
    await prisma.taskAssignee.deleteMany({})

    console.log('Deleting timers...')
    await prisma.timer.deleteMany({})

    console.log('Deleting time logs...')
    await prisma.timeLog.deleteMany({})

    console.log('Deleting comments...')
    await prisma.comment.deleteMany({})

    console.log('Deleting subtasks...')
    await prisma.subTask.deleteMany({})

    console.log('Deleting tasks...')
    await prisma.task.deleteMany({})

    console.log('Deleting task templates...')
    await prisma.taskTemplate.deleteMany({})

    console.log('Deleting custom statuses...')
    await prisma.customStatus.deleteMany({})

    console.log('Deleting custom types...')
    await prisma.customType.deleteMany({})

    console.log('Deleting projects...')
    await prisma.project.deleteMany({})

    console.log('Deleting activities...')
    await prisma.activity.deleteMany({})

    console.log('Deleting workspace members...')
    await prisma.workspaceMember.deleteMany({})

    console.log('Deleting workspaces...')
    await prisma.workspace.deleteMany({})

    console.log('Deleting users...')
    await prisma.user.deleteMany({})

    console.log('\n✅ Database cleaned successfully!')
    console.log('📊 All tables are now empty.')
    console.log('\n💡 You can now:')
    console.log('   - Run "npm run db:seed" to add sample data')
    console.log('   - Start fresh by creating new users and workspaces\n')

  } catch (error) {
    console.error('❌ Error cleaning database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the cleanup
cleanDatabase()
  .then(() => {
    console.log('👋 Cleanup complete. Goodbye!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  })
