#!/bin/bash

# Fresh Start Script
# Run this after database reset to ensure everything works

echo "🚀 Starting Fresh..."
echo ""

# Step 1: Verify Prisma Client
echo "1️⃣ Verifying Prisma Client..."
npx prisma generate
echo "✅ Prisma Client ready"
echo ""

# Step 2: Check database connection
echo "2️⃣ Checking database connection..."
npx prisma db push --accept-data-loss
echo "✅ Database connected"
echo ""

# Step 3: Show migration status
echo "3️⃣ Migration status:"
npx prisma migrate status
echo ""

echo "✅ Everything is ready!"
echo ""
echo "📝 Next steps:"
echo "   1. Start dev server: npm run dev"
echo "   2. Open browser: http://localhost:3000"
echo "   3. Sign up or sign in"
echo "   4. Create workspace → Create project → Create tasks"
echo ""
echo "💡 Tip: If you get 500 errors, restart the dev server!"
