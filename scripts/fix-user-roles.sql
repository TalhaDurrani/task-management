-- Migration: Fix User Roles (Remove USER and SUPER_ADMIN)
-- Date: October 3, 2025
-- Purpose: Update all existing user roles to use ADMIN or MEMBER only

-- Step 1: Check current roles
SELECT 
    role,
    COUNT(*) as count
FROM users
GROUP BY role
ORDER BY count DESC;

-- Step 2: Create backup (optional but recommended)
-- CREATE TABLE users_backup_20251003 AS SELECT * FROM users;

-- Step 3: Update all USER roles to MEMBER
UPDATE users 
SET role = 'MEMBER' 
WHERE role IN ('USER', 'user', 'User');

-- Step 4: Update all SUPER_ADMIN roles to ADMIN
UPDATE users 
SET role = 'ADMIN' 
WHERE role IN ('SUPER_ADMIN', 'super_admin', 'SuperAdmin');

-- Step 5: Verify the changes
SELECT 
    id,
    name,
    email,
    role,
    "workspaceId",
    "createdAt"
FROM users
ORDER BY role, "createdAt";

-- Step 6: Final verification - should only show ADMIN and MEMBER
SELECT DISTINCT role FROM users;

-- Expected output:
-- role
-- ------
-- ADMIN
-- MEMBER

-- Step 7: Check if any users don't have workspace assignment
SELECT 
    id,
    name,
    email,
    role,
    "workspaceId"
FROM users
WHERE "workspaceId" IS NULL;

-- If any users without workspace, they need to be assigned or deleted
