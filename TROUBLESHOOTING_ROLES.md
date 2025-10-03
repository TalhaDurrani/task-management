# Frontend Role Access - Quick Troubleshooting Guide

## 🚨 Are you seeing "Access Denied" when you should have access?

Follow this checklist:

---

## ✅ **Quick Fix Checklist**

### **1. Check Your Database Roles**

Open terminal and run:
```bash
npx prisma studio
```

Then:
1. Click on "users" table
2. Check the "role" column
3. Make sure your user has role = `ADMIN` (not `USER` or `SUPER_ADMIN`)

---

### **2. Fix Database Roles** 

If you see old roles (USER, SUPER_ADMIN), run this:

```bash
# Option A: Re-seed (wipes all data)
npx prisma migrate reset --force
npx prisma db seed

# Option B: Fix roles manually (keeps data)
# Connect to your database and run:
# UPDATE users SET role = 'MEMBER' WHERE role = 'USER';
# UPDATE users SET role = 'ADMIN' WHERE role = 'SUPER_ADMIN';
```

---

### **3. Clear Browser Cache**

```bash
# In browser:
1. Open DevTools (F12)
2. Go to Application tab
3. Clear Storage > Clear site data
4. Or just Ctrl+Shift+Delete
```

---

### **4. Restart Dev Server**

```bash
# Stop server (Ctrl+C)
# Then restart:
npm run dev
```

---

### **5. Check Console Logs**

When you visit `/dashboard/admin`, check browser console:

```
🔍 Admin page - User: {id: "...", role: "ADMIN", ...}
🔍 Admin page - Role: ADMIN
🔍 Admin page - Is ADMIN?: true
```

If you see:
- `Role: USER` → Database needs fixing (see step 2)
- `Role: undefined` → Login issue (re-login)
- `Is ADMIN?: false` → Role mismatch

---

### **6. Test Login**

```bash
# Admin user (should access /dashboard/admin)
Email: admin@example.com
Password: admin123

# Member user (should NOT access /dashboard/admin)
Email: john@example.com
Password: member123
```

---

## 🔍 **Debug Mode**

The admin page now shows your current role if access is denied.

If you see **"Current role: MEMBER"** when you should be ADMIN:
→ Your database has wrong role value

If you see **"Current role: undefined"**:
→ You're not logged in properly

---

## 🛠️ **Common Fixes**

### **Problem: "Role is undefined"**

**Solution:**
```bash
# 1. Logout completely
# 2. Clear cookies
# 3. Login again with: admin@example.com / admin123
```

---

### **Problem: "Role is MEMBER but I'm the workspace owner"**

**Solution:**
```sql
-- In database:
UPDATE users 
SET role = 'ADMIN' 
WHERE email = 'your@email.com';
```

---

### **Problem: "Access denied after fresh login"**

**Solution:**
```bash
# Regenerate Prisma client
npx prisma generate

# Restart TypeScript server in VSCode
# Press: Ctrl+Shift+P → "TypeScript: Restart TS Server"

# Restart dev server
npm run dev
```

---

## 📞 **Still Not Working?**

Run full diagnostic:

```bash
# 1. Check Prisma schema
npx prisma validate

# 2. Check database
npx prisma studio

# 3. Check migrations
npx prisma migrate status

# 4. Re-generate client
npx prisma generate

# 5. Check for TypeScript errors
npm run build
```

---

## 💡 **Expected Behavior**

### **ADMIN Role:**
✅ Can access `/dashboard/admin`
✅ Can see "Administration" in sidebar
✅ Can manage users
✅ Can create/edit/delete projects
✅ All features available

### **MEMBER Role:**
✅ Can access `/dashboard`
✅ Can view projects
✅ Can be assigned tasks
✅ Can log time
❌ Cannot access `/dashboard/admin`
❌ Cannot see "Administration" in sidebar
❌ Cannot manage users

---

## 🎯 **Quick Verification**

1. ✅ Database has only ADMIN and MEMBER roles
2. ✅ Admin user has role = ADMIN
3. ✅ Browser console shows correct role
4. ✅ No TypeScript errors in terminal
5. ✅ Can login successfully
6. ✅ Dashboard loads without errors

If all checkmarks pass, role access should work perfectly!

---

**Last Updated:** October 3, 2025
**Version:** 1.0
