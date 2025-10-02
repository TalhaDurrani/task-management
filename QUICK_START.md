# 🚀 Quick Start Guide - After Database Connection

## Step-by-Step Instructions

### 1️⃣ **Connect Your Database**
Make sure your PostgreSQL database is running and `.env` has the correct DATABASE_URL

### 2️⃣ **Run Database Migration**
```bash
npx prisma migrate dev --name remove_organization_update_roles
```

This will:
- Remove the organizations table
- Update all affected tables
- Add new fields (ownerId, completed, updatedAt)
- Update the Role enum

### 3️⃣ **Generate Prisma Client**
```bash
npx prisma generate
```

### 4️⃣ **Restart TypeScript Server in VSCode**
- Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
- Type: "TypeScript: Restart TS Server"
- Hit Enter

### 5️⃣ **Verify Everything Works**
```bash
# Check for TypeScript errors
npx tsc --noEmit

# Or start the dev server
npm run dev
```

---

## 🔧 If Migration Fails

If you get errors about existing data, you may need to:

### Option A: Fresh Start (Development Only)
```bash
# ⚠️ WARNING: This deletes all data!
npx prisma migrate reset
npx prisma migrate dev --name initial_setup
```

### Option B: Manual Data Migration (Production)
```sql
-- 1. Backup existing data
-- 2. Run these SQL commands manually:

-- Add ownerId to workspaces (set first user as owner)
ALTER TABLE workspaces ADD COLUMN owner_id UUID;

UPDATE workspaces w
SET owner_id = (
  SELECT id FROM users WHERE workspace_id = w.id LIMIT 1
);

ALTER TABLE workspaces ALTER COLUMN owner_id SET NOT NULL;

-- Remove organization references
ALTER TABLE users DROP COLUMN IF EXISTS organization_id;
ALTER TABLE projects DROP COLUMN IF EXISTS organization_id;

-- Update Role enum
ALTER TYPE "Role" RENAME VALUE 'USER' TO 'MEMBER';
-- Note: SUPER_ADMIN values need manual update to ADMIN

-- Add missing fields
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE sub_tasks ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;

-- Drop organizations table
DROP TABLE IF EXISTS organizations CASCADE;
```

---

## 🧪 Testing the New Flow

### Test User Registration:
1. Go to `/auth/register`
2. Create a new account
3. Check that:
   - User is created with role `ADMIN`
   - Workspace is auto-created
   - User's workspaceId is set
   - User is workspace owner

### Test Workspace Access:
1. Login with the new user
2. Create a project
3. Verify it's linked to the workspace
4. Check that organizationId is not required

---

## 📋 Current Status

✅ Database schema updated  
✅ Prisma client regenerated  
✅ Auth service updated  
✅ All API routes cleaned  
✅ Services updated  
⏳ **Waiting for:** Database migration to apply changes  
⏳ **Waiting for:** Frontend component updates  
⏳ **Waiting for:** Form TypeScript error fixes  

---

## 🐛 Known Issues to Fix

1. **TypeScript Errors in Forms**
   - File: `src/components/tasks/create-task-dialog.tsx`
   - Issue: Form schema type mismatches
   - Status: Pending

2. **Frontend Role Updates**
   - Replace all "USER" text with "MEMBER"
   - Remove organization selectors
   - Add member management UI

3. **Workspace Management**
   - Add "Invite Member" feature
   - Add "Manage Roles" feature
   - Show workspace owner badge

---

## 🆘 Troubleshooting

### "ownerId does not exist" Error
```bash
# Solution:
rm -rf node_modules/.prisma
npx prisma generate
# Restart VS Code
```

### Migration Conflicts
```bash
# Check current migrations
npx prisma migrate status

# If needed, reset (⚠️ deletes data)
npx prisma migrate reset
```

### TypeScript Still Shows Errors
```bash
# Clear TypeScript cache
rm -rf node_modules
rm package-lock.json
npm install
npm run build
```

---

## 📞 Need Help?

If you encounter any issues:
1. Check the error message carefully
2. Verify database connection
3. Make sure all migrations ran successfully
4. Restart your development server
5. Clear browser cache and cookies

---

**Ready to proceed? Start with Step 1! 🚀**
