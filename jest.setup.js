// Ensure database connection is available for tests
const { PrismaClient } = require('@prisma/client')

// Extend timeout for database operations
jest.setTimeout(10000)

// Optional: Add global setup or mocking if needed
global.prisma = new PrismaClient()
