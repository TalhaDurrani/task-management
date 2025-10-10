/**
 * Complete Database Reset Script
 * 
 * This script will:
 * 1. Drop all tables (complete reset)
 * 2. Run migrations to recreate schema
 * 3. Optionally seed with sample data
 * 
 * ⚠️  WARNING: This will DESTROY ALL DATA!
 * 
 * Usage:
 *   npm run db:reset        (reset and seed)
 *   npm run db:reset:clean  (reset only, no seed)
 */

const { execSync } = require('child_process')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function executeCommand(command, description) {
  console.log(`\n🔄 ${description}...`)
  try {
    execSync(command, { stdio: 'inherit' })
    console.log(`✅ ${description} completed!`)
  } catch (error) {
    console.error(`❌ Error during ${description}:`, error.message)
    throw error
  }
}

async function confirmReset() {
  return new Promise((resolve) => {
    rl.question(
      '\n⚠️  WARNING: This will DELETE ALL DATA in your database!\n' +
      '   Type "YES" to confirm: ',
      (answer) => {
        resolve(answer === 'YES')
      }
    )
  })
}

async function resetDatabase() {
  console.log('🔄 Database Reset Tool')
  console.log('=' .repeat(50))

  // Confirm action
  const confirmed = await confirmReset()
  rl.close()

  if (!confirmed) {
    console.log('\n❌ Reset cancelled. No changes made.')
    process.exit(0)
  }

  console.log('\n🚀 Starting database reset...\n')

  try {
    // Step 1: Reset database (drop all tables)
    executeCommand(
      'npx prisma migrate reset --force --skip-seed',
      'Dropping all tables and recreating schema'
    )

    // Step 2: Generate Prisma Client
    executeCommand(
      'npx prisma generate',
      'Generating Prisma Client'
    )

    // Step 3: Check if we should seed
    const shouldSeed = process.argv.includes('--seed') || !process.argv.includes('--no-seed')
    
    if (shouldSeed) {
      executeCommand(
        'npx prisma db seed',
        'Seeding database with sample data'
      )
    } else {
      console.log('\n⏭️  Skipping seed (--no-seed flag detected)')
    }

    console.log('\n' + '='.repeat(50))
    console.log('✅ Database reset complete!')
    console.log('\n📊 Your database is now fresh and ready to use.')
    
    if (shouldSeed) {
      console.log('✨ Sample data has been added.')
    }
    
    console.log('\n💡 Next steps:')
    console.log('   - Start your dev server: npm run dev')
    console.log('   - Login with seed credentials (check prisma/seed.ts)')
    console.log('')

  } catch (error) {
    console.error('\n💥 Reset failed:', error)
    process.exit(1)
  }
}

// Run the reset
resetDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
