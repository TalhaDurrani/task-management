#!/usr/bin/env bash

# Script: Fix User Roles in Database
# Date: October 3, 2025
# Purpose: Update all users to have correct ADMIN or MEMBER roles

echo "🔧 Starting role fix process..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "Please set it in your .env file"
    exit 1
fi

echo "📊 Current role distribution:"
echo "--------------------------------"
npx prisma db execute --file scripts/fix-user-roles.sql

echo ""
echo "✅ Role fix complete!"
echo ""
echo "🧪 To verify the changes, run:"
echo "   npx prisma studio"
echo ""
echo "Or check in your database client:"
echo "   SELECT DISTINCT role FROM users;"
echo ""
