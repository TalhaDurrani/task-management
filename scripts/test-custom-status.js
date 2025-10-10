/**
 * Test Script for Custom Status Feature
 * 
 * This script tests the complete custom status flow:
 * 1. Creates custom statuses in the database
 * 2. Creates a test task
 * 3. Updates task with custom statuses
 * 4. Verifies the data is stored correctly
 * 
 * Usage: node scripts/test-custom-status.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Color palette for custom statuses
const COLORS = {
  BACKLOG: ['#6B7280', '#9CA3AF', '#D1D5DB'],
  IN_PROGRESS: ['#3B82F6', '#60A5FA', '#93C5FD'],
  COMPLETED: ['#10B981', '#34D399', '#6EE7B7'],
  ON_HOLD: ['#F59E0B', '#FBBF24', '#FCD34D']
}

async function main() {
  console.log('🚀 Starting Custom Status Test Script\n')

  try {
    // Step 1: Get or create a test workspace
    console.log('📦 Step 1: Setting up test workspace...')
    let workspace = await prisma.workspace.findFirst()
    
    if (!workspace) {
      const owner = await prisma.user.findFirst()
      if (!owner) {
        throw new Error('No users found. Please create a user first.')
      }

      workspace = await prisma.workspace.create({
        data: {
          name: 'Test Workspace',
          description: 'Workspace for testing custom statuses',
          ownerId: owner.id,
          joinCode: `TEST-${Date.now()}`
        }
      })
      console.log(`✅ Created workspace: ${workspace.name} (ID: ${workspace.id})`)
    } else {
      console.log(`✅ Using existing workspace: ${workspace.name} (ID: ${workspace.id})`)
    }

    // Step 2: Create custom statuses
    console.log('\n📝 Step 2: Creating custom statuses...')
    
    const customStatuses = [
      // BACKLOG category
      { name: 'Backlog', category: 'BACKLOG', color: COLORS.BACKLOG[0] },
      { name: 'Ready for Dev', category: 'BACKLOG', color: COLORS.BACKLOG[1] },
      
      // IN_PROGRESS category
      { name: 'In Development', category: 'IN_PROGRESS', color: COLORS.IN_PROGRESS[0] },
      { name: 'In Review', category: 'IN_PROGRESS', color: COLORS.IN_PROGRESS[1] },
      { name: 'In Testing', category: 'IN_PROGRESS', color: COLORS.IN_PROGRESS[2] },
      
      // COMPLETED category
      { name: 'Completed', category: 'COMPLETED', color: COLORS.COMPLETED[0] },
      { name: 'Deployed', category: 'COMPLETED', color: COLORS.COMPLETED[1] },
      
      // ON_HOLD category
      { name: 'Blocked', category: 'ON_HOLD', color: COLORS.ON_HOLD[0] },
      { name: 'On Hold', category: 'ON_HOLD', color: COLORS.ON_HOLD[1] }
    ]

    const createdStatuses = []
    
    for (const statusData of customStatuses) {
      try {
        const status = await prisma.customStatus.upsert({
          where: {
            name_workspaceId: {
              name: statusData.name,
              workspaceId: workspace.id
            }
          },
          update: {
            category: statusData.category,
            color: statusData.color
          },
          create: {
            name: statusData.name,
            category: statusData.category,
            color: statusData.color,
            workspaceId: workspace.id
          }
        })
        createdStatuses.push(status)
        console.log(`  ✅ ${status.name} (${status.category}) - ${status.color}`)
      } catch (error) {
        console.log(`  ⚠️  ${statusData.name} already exists or error: ${error.message}`)
      }
    }

    console.log(`\n✅ Created/Updated ${createdStatuses.length} custom statuses`)

    // Step 3: Get or create a test project
    console.log('\n📁 Step 3: Setting up test project...')
    const user = await prisma.user.findFirst()
    
    let project = await prisma.project.findFirst({
      where: { workspaceId: workspace.id }
    })

    if (!project) {
      project = await prisma.project.create({
        data: {
          title: 'Test Project',
          description: 'Project for testing custom statuses',
          workspaceId: workspace.id,
          userId: user.id
        }
      })
      console.log(`✅ Created project: ${project.title} (ID: ${project.id})`)
    } else {
      console.log(`✅ Using existing project: ${project.title} (ID: ${project.id})`)
    }

    // Step 4: Create a test task
    console.log('\n📋 Step 4: Creating test task...')
    const task = await prisma.task.create({
      data: {
        title: 'Test Task for Custom Status',
        description: 'This task is used to test the custom status feature',
        projectId: project.id,
        createdBy: user.id,
        status: 1, // Default to BACKLOG
        statusCategory: 'BACKLOG',
        priority: 'MEDIUM',
        type: 'TASK'
      }
    })
    console.log(`✅ Created task: ${task.title} (ID: ${task.id})`)
    console.log(`   Initial state: status=${task.status}, customStatus=${task.customStatus || 'null'}, category=${task.statusCategory}`)

    // Step 5: Test updating task with different custom statuses
    console.log('\n🔄 Step 5: Testing custom status updates...')
    
    const testUpdates = [
      { statusName: 'In Review', expectedNumeric: 2, expectedCategory: 'IN_PROGRESS' },
      { statusName: 'In Testing', expectedNumeric: 2, expectedCategory: 'IN_PROGRESS' },
      { statusName: 'Blocked', expectedNumeric: 1, expectedCategory: 'ON_HOLD' },
      { statusName: 'Deployed', expectedNumeric: 3, expectedCategory: 'COMPLETED' },
      { statusName: 'Ready for Dev', expectedNumeric: 1, expectedCategory: 'BACKLOG' }
    ]

    for (const test of testUpdates) {
      const customStatus = createdStatuses.find(s => s.name === test.statusName)
      
      if (!customStatus) {
        console.log(`  ⚠️  Status "${test.statusName}" not found, skipping...`)
        continue
      }

      // Map category to numeric status
      let numericStatus = 1
      switch (customStatus.category) {
        case 'BACKLOG':
          numericStatus = 1
          break
        case 'IN_PROGRESS':
          numericStatus = 2
          break
        case 'COMPLETED':
          numericStatus = 3
          break
        case 'ON_HOLD':
          numericStatus = 1 // Treat as BACKLOG
          break
      }

      const updatedTask = await prisma.task.update({
        where: { id: task.id },
        data: {
          status: numericStatus,
          customStatus: customStatus.name,
          statusCategory: customStatus.category
        }
      })

      const statusMatch = updatedTask.status === test.expectedNumeric ? '✅' : '❌'
      const categoryMatch = updatedTask.statusCategory === test.expectedCategory ? '✅' : '❌'
      const customStatusMatch = updatedTask.customStatus === test.statusName ? '✅' : '❌'

      console.log(`\n  Testing: "${test.statusName}"`)
      console.log(`    ${statusMatch} status: ${updatedTask.status} (expected: ${test.expectedNumeric})`)
      console.log(`    ${customStatusMatch} customStatus: "${updatedTask.customStatus}" (expected: "${test.statusName}")`)
      console.log(`    ${categoryMatch} statusCategory: ${updatedTask.statusCategory} (expected: ${test.expectedCategory})`)

      // Verify data types
      if (typeof updatedTask.status !== 'number') {
        console.log(`    ❌ ERROR: status is ${typeof updatedTask.status}, expected number`)
      }
      if (typeof updatedTask.customStatus !== 'string' && updatedTask.customStatus !== null) {
        console.log(`    ❌ ERROR: customStatus is ${typeof updatedTask.customStatus}, expected string or null`)
      }

      // Small delay between updates
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Step 6: Verify final state
    console.log('\n🔍 Step 6: Verifying final task state...')
    const finalTask = await prisma.task.findUnique({
      where: { id: task.id },
      select: {
        id: true,
        title: true,
        status: true,
        customStatus: true,
        statusCategory: true,
        updatedAt: true
      }
    })

    console.log('Final task state:')
    console.log(`  ID: ${finalTask.id}`)
    console.log(`  Title: ${finalTask.title}`)
    console.log(`  status (Int): ${finalTask.status} (type: ${typeof finalTask.status})`)
    console.log(`  customStatus (String): "${finalTask.customStatus}" (type: ${typeof finalTask.customStatus})`)
    console.log(`  statusCategory (Enum): ${finalTask.statusCategory}`)
    console.log(`  Updated At: ${finalTask.updatedAt}`)

    // Step 7: Test the API endpoint
    console.log('\n🌐 Step 7: API Endpoint Test Summary')
    console.log('To test the API endpoint, use:')
    console.log(`
PUT http://localhost:3000/api/tasks/${task.id}
Content-Type: application/json

{
  "status": 2,
  "customStatus": "In Review"
}
    `)

    // Step 8: Display all custom statuses
    console.log('\n📊 Step 8: Available Custom Statuses in Database')
    console.log('┌─────────────────────────┬──────────────┬──────────┐')
    console.log('│ Name                    │ Category     │ Color    │')
    console.log('├─────────────────────────┼──────────────┼──────────┤')
    
    for (const status of createdStatuses) {
      const name = status.name.padEnd(23)
      const category = status.category.padEnd(12)
      const color = (status.color || 'N/A').padEnd(8)
      console.log(`│ ${name} │ ${category} │ ${color} │`)
    }
    console.log('└─────────────────────────┴──────────────┴──────────┘')

    console.log('\n✅ Test completed successfully!')
    console.log('\n💡 Next Steps:')
    console.log('1. Open http://localhost:3000 in your browser')
    console.log('2. Navigate to the test project')
    console.log('3. Try changing the task status using the dropdown')
    console.log('4. Verify in DevTools Network tab that status is numeric and customStatus is string')
    console.log('5. Check the database to confirm data is saved correctly')

  } catch (error) {
    console.error('\n❌ Error during test:', error)
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
