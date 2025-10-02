import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Clean up existing data
  await prisma.activity.deleteMany()
  await prisma.taskCustomField.deleteMany()
  await prisma.customField.deleteMany()
  await prisma.customStatus.deleteMany()
  await prisma.customType.deleteMany()
  await prisma.attachment.deleteMany()
  await prisma.timer.deleteMany()
  await prisma.timeLog.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.subTask.deleteMany()
  await prisma.taskAssignee.deleteMany()
  await prisma.task.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()
  await prisma.workspace.deleteMany()

  console.log('🧹 Cleaned existing data')

  // Create Admin User with Workspace
  const adminPassword = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  const adminWorkspace = await prisma.workspace.create({
    data: {
      name: "Admin's Workspace",
      description: 'Main workspace for admin',
      ownerId: adminUser.id,
    } as any,
  })

  // Update admin user with workspace
  await prisma.user.update({
    where: { id: adminUser.id },
    data: { workspaceId: adminWorkspace.id },
  })

  console.log('✅ Created Admin User')
  console.log(`   Email: admin@example.com`)
  console.log(`   Password: admin123`)
  console.log(`   Workspace: ${adminWorkspace.name}`)

  // Create Member Users
  const memberPassword = await bcrypt.hash('member123', 10)
  
  const member1 = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      password: memberPassword,
      role: 'MEMBER' as any,
      workspaceId: adminWorkspace.id,
    },
  })

  const member2 = await prisma.user.create({
    data: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: memberPassword,
      role: 'MEMBER' as any,
      workspaceId: adminWorkspace.id,
    },
  })

  console.log('✅ Created Member Users')
  console.log(`   John: john@example.com / member123`)
  console.log(`   Jane: jane@example.com / member123`)

  // Create Projects
  const project1 = await prisma.project.create({
    data: {
      title: 'Website Redesign',
      description: 'Redesign the company website with modern UI/UX',
      projectName: 'website-redesign',
      userId: adminUser.id,
      workspaceId: adminWorkspace.id,
      noOfAssignedUsers: 2,
    },
  })

  const project2 = await prisma.project.create({
    data: {
      title: 'Mobile App Development',
      description: 'Build a cross-platform mobile application',
      projectName: 'mobile-app',
      userId: adminUser.id,
      workspaceId: adminWorkspace.id,
      noOfAssignedUsers: 1,
    },
  })

  console.log('✅ Created Projects')

  // Create Custom Types
  const customTypes = await Promise.all([
    prisma.customType.create({
      data: {
        name: 'RESEARCH',
        color: '#8B5CF6',
        workspaceId: adminWorkspace.id,
      },
    }),
    prisma.customType.create({
      data: {
        name: 'DESIGN',
        color: '#EC4899',
        workspaceId: adminWorkspace.id,
      },
    }),
  ])

  console.log('✅ Created Custom Task Types')

  // Create Custom Statuses
  const customStatuses = await Promise.all([
    prisma.customStatus.create({
      data: {
        name: 'REVIEW',
        color: '#F59E0B',
        category: 'IN_PROGRESS',
        workspaceId: adminWorkspace.id,
      },
    }),
    prisma.customStatus.create({
      data: {
        name: 'BLOCKED',
        color: '#EF4444',
        category: 'ON_HOLD',
        workspaceId: adminWorkspace.id,
      },
    }),
  ])

  console.log('✅ Created Custom Statuses')

  // Create Tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'Design Homepage Mockup',
      description: 'Create a modern homepage design with Figma',
      type: 'DESIGN',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      statusCategory: 'IN_PROGRESS',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      projectId: project1.id,
      createdBy: adminUser.id,
    },
  })

  const task2 = await prisma.task.create({
    data: {
      title: 'Setup React Project',
      description: 'Initialize React project with TypeScript and Vite',
      type: 'TASK',
      priority: 'MEDIUM',
      status: 'TODO',
      statusCategory: 'BACKLOG',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      projectId: project2.id,
      createdBy: adminUser.id,
    },
  })

  const task3 = await prisma.task.create({
    data: {
      title: 'Fix Login Bug',
      description: 'Users are unable to login with special characters in password',
      type: 'BUG',
      priority: 'CRITICAL',
      status: 'IN_PROGRESS',
      statusCategory: 'IN_PROGRESS',
      projectId: project1.id,
      createdBy: adminUser.id,
    },
  })

  console.log('✅ Created Tasks')

  // Assign tasks to members
  await prisma.taskAssignee.createMany({
    data: [
      { taskId: task1.id, userId: member1.id },
      { taskId: task2.id, userId: member2.id },
      { taskId: task3.id, userId: member1.id },
    ],
  })

  console.log('✅ Assigned Tasks to Members')

  // Create Subtasks
  await prisma.subTask.createMany({
    data: [
      {
        taskId: task1.id,
        userId: member1.id,
        title: 'Research competitor websites',
        description: 'Analyze 5 competitor websites',
        completed: true,
      },
      {
        taskId: task1.id,
        userId: member1.id,
        title: 'Create color palette',
        description: 'Choose primary and secondary colors',
        completed: false,
      },
      {
        taskId: task2.id,
        userId: member2.id,
        title: 'Install dependencies',
        description: 'npm install required packages',
        completed: true,
      },
      {
        taskId: task2.id,
        userId: member2.id,
        title: 'Setup routing',
        description: 'Configure React Router',
        completed: false,
      },
    ] as any,
  })

  console.log('✅ Created Subtasks')

  // Create Comments
  await prisma.comment.createMany({
    data: [
      {
        taskId: task1.id,
        userId: adminUser.id,
        content: 'Please make sure to follow our brand guidelines',
      },
      {
        taskId: task1.id,
        userId: member1.id,
        content: 'Sure! I will review the brand guidelines document',
      },
      {
        taskId: task3.id,
        userId: member1.id,
        content: 'Found the issue - it was in the password validation regex',
      },
    ],
  })

  console.log('✅ Created Comments')

  // Create Time Logs
  await prisma.timeLog.createMany({
    data: [
      {
        taskId: task1.id,
        userId: member1.id,
        hoursSpent: 3.5,
        description: 'Initial research and mockup creation',
        logDate: new Date(),
      },
      {
        taskId: task2.id,
        userId: member2.id,
        hoursSpent: 2.0,
        description: 'Project setup and configuration',
        logDate: new Date(),
      },
      {
        taskId: task3.id,
        userId: member1.id,
        hoursSpent: 1.5,
        description: 'Bug investigation and fix',
        logDate: new Date(),
      },
    ],
  })

  console.log('✅ Created Time Logs')

  // Create Activities
  await prisma.activity.createMany({
    data: [
      {
        userId: adminUser.id,
        type: 'PROJECT_CREATED',
        title: 'Project Created',
        message: 'Created project "Website Redesign"',
        projectId: project1.id,
      },
      {
        userId: adminUser.id,
        type: 'TASK_CREATED',
        title: 'Task Created',
        message: 'Created task "Design Homepage Mockup"',
        taskId: task1.id,
        projectId: project1.id,
      },
      {
        userId: member1.id,
        type: 'TASK_ASSIGNED',
        title: 'Task Assigned',
        message: 'Assigned to "Design Homepage Mockup"',
        taskId: task1.id,
        projectId: project1.id,
      },
    ],
  })

  console.log('✅ Created Activities')

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`   - 1 Admin User (workspace owner)`)
  console.log(`   - 2 Member Users`)
  console.log(`   - 1 Workspace`)
  console.log(`   - 2 Projects`)
  console.log(`   - 3 Tasks`)
  console.log(`   - 4 Subtasks`)
  console.log(`   - 3 Comments`)
  console.log(`   - 3 Time Logs`)
  console.log(`   - 2 Custom Types`)
  console.log(`   - 2 Custom Statuses`)
  console.log(`   - 3 Activities`)
  console.log('\n🔐 Login Credentials:')
  console.log(`   Admin: admin@example.com / admin123`)
  console.log(`   Member 1: john@example.com / member123`)
  console.log(`   Member 2: jane@example.com / member123`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
