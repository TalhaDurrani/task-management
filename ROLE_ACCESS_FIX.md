# Frontend Role Access Issues - Complete Fix Guide

## Date: October 3, 2025

---

## 🔍 **Problem Identified**

Users are facing role-based access issues because:

1. **Database might have old role values** (USER, SUPER_ADMIN) that don't match new role checks
2. **Frontend is checking for "ADMIN"** but database might still have "USER" or other old values
3. **Type mismatches** between what's in DB and what TypeScript expects

---

## ✅ **Solution: 3-Step Fix**

### **Step 1: Update Existing Database Roles**

Run this SQL to fix any existing user roles:

```sql
-- Update any USER roles to MEMBER
UPDATE users 
SET role = 'MEMBER' 
WHERE role = 'USER';

-- Update any SUPER_ADMIN roles to ADMIN
UPDATE users 
SET role = 'ADMIN' 
WHERE role = 'SUPER_ADMIN';

-- Verify the changes
SELECT id, name, email, role, "workspaceId" FROM users;
```

**OR** re-seed the database (this will delete all data):

```bash
npx prisma migrate reset --force
npx prisma db seed
```

---

### **Step 2: Update Role Verification in Auth**

The role verification is already correct in `src/lib/auth.ts`:

```typescript
// JWT payload type is correct
role: 'MEMBER' | 'ADMIN'
```

**✅ This is already fixed!**

---

### **Step 3: Add Debug Logging (Temporary)**

To help diagnose issues, add temporary logging:

#### **In Admin Page (`src/app/dashboard/admin/page.tsx`)**

```typescript
useEffect(() => {
  const loadUser = async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'GET'
      })
      const result = await response.json()
      
      console.log('🔍 Admin page - User data:', result.user)
      console.log('🔍 Admin page - User role:', result.user?.role)
      console.log('🔍 Admin page - Role check:', result.user?.role === "ADMIN")
      
      if (result.success && result.user) {
        setUser(result.user)
      } else {
        router.push("/auth/signin?callbackUrl=/dashboard/admin")
      }
    } catch (error) {
      console.error('Failed to load user:', error)
      router.push("/auth/signin?callbackUrl=/dashboard/admin")
    }
    setIsLoading(false)
  }
  
  loadUser()
}, [router])
```

---

## 🔧 **Quick Fixes to Apply Now**

### **Fix 1: Make Role Check More Flexible**

Update the admin page to be case-insensitive:

```typescript
// Instead of:
if (!user || user.role !== "ADMIN") {

// Use:
if (!user || user.role?.toUpperCase() !== "ADMIN") {
```

### **Fix 2: Add Type Safety to User State**

```typescript
interface UserType {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'MEMBER'
  workspaceId: string | null
  workspace?: {
    id: string
    name: string
  } | null
}

const [user, setUser] = useState<UserType | null>(null)
```

---

## 📋 **Complete Working Files**

I'll create fixed versions of the key files below.

---

## 🧪 **Testing Steps**

### **1. Check Current Database Roles**

Open Prisma Studio:
```bash
npx prisma studio
```

Look at the `users` table and check the `role` column. Should only show:
- `ADMIN`
- `MEMBER`

If you see `USER` or `SUPER_ADMIN`, run the SQL update above.

---

### **2. Test Login Flow**

1. Login with admin user: `admin@example.com` / `admin123`
2. Check browser console for role value
3. Navigate to `/dashboard/admin`
4. Should see admin dashboard (not access denied)

---

### **3. Test Member Access**

1. Logout
2. Login with member: `john@example.com` / `member123`
3. Navigate to `/dashboard/admin`
4. Should see "Access Denied" message

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: Still seeing "Access Denied" for admin**

**Cause:** Database still has old role value

**Fix:**
```bash
# Re-seed database
npx prisma migrate reset --force
npx prisma db seed
```

---

### **Issue 2: TypeScript errors on role comparison**

**Cause:** Type mismatch between DB and TypeScript

**Fix:** Add proper type casting:
```typescript
const userRole = (user?.role as string)?.toUpperCase()
if (userRole === 'ADMIN') {
  // Show admin features
}
```

---

### **Issue 3: Sidebar not showing admin section**

**Cause:** Role comparison issue

**Fix:** Check the sidebar component:
```typescript
{currentUser?.role === "ADMIN" && (
  <NavigationSection title="Administration" items={adminNavigation} />
)}
```

Make sure `currentUser.role` is actually "ADMIN" (log it to console).

---

## 🔄 **Migration Script for Existing Production Data**

If you have production data with old roles, use this migration:

```sql
-- Create backup
CREATE TABLE users_backup AS SELECT * FROM users;

-- Update roles
BEGIN;

UPDATE users 
SET role = 'MEMBER' 
WHERE role IN ('USER', 'user', 'User');

UPDATE users 
SET role = 'ADMIN' 
WHERE role IN ('SUPER_ADMIN', 'super_admin', 'SuperAdmin', 'ADMIN', 'admin', 'Admin');

-- Verify no invalid roles remain
SELECT DISTINCT role FROM users;
-- Should only show: ADMIN, MEMBER

COMMIT;
```

---

## 📝 **Environment Check**

Make sure your `.env` file has:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/your_db"
JWT_SECRET="your-secret-key-here"
NODE_ENV="development"
```

---

## 🎯 **Next Steps**

After applying these fixes:

1. ✅ Clear browser cookies and localStorage
2. ✅ Restart Next.js dev server
3. ✅ Login with admin credentials
4. ✅ Check console logs
5. ✅ Verify admin dashboard access
6. ✅ Test member access (should be denied)
7. ✅ Remove debug console.log statements

---

## 📞 **If Still Having Issues**

Run this diagnostic:

```bash
# Check database connection
npx prisma db pull

# Check current schema
npx prisma studio

# Verify migrations
npx prisma migrate status

# Re-generate Prisma client
npx prisma generate

# Restart TypeScript server in VSCode
# Press: Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

---

**Status:** 🔧 Ready to Apply
**Priority:** HIGH
**Time to Fix:** 5-10 minutes
