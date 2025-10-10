# 🔄 After Database Reset - Action Items

## ⚠️ Important: Must Do After Every DB Reset

When you reset the database, follow these steps:

### 1️⃣ Stop the Dev Server
```bash
# Press Ctrl+C in the terminal running npm run dev
```

### 2️⃣ Verify Prisma Client
```bash
# Should already be done by reset script, but verify
npx prisma generate
```

### 3️⃣ Restart Dev Server
```bash
npm run dev
```

### 4️⃣ Create Initial Data
Now you can:
1. **Create a new account** at `/auth/signup`
2. **Create your first workspace**
3. **Create projects and tasks**

---

## 🐛 If You're Getting 500 Errors

### Error: "Internal Server Error" when creating tasks

**Symptoms:**
- 500 errors on `/api/tasks`
- 500 errors on `/api/tags`
- Console shows "Failed to load resource"

**Fix:**
1. **Restart the dev server** (most common fix)
2. Check if you're logged in
3. Make sure you have a workspace created
4. Make sure you're in a project

---

## ✅ Quick Health Check

Run these commands to verify everything is working:

```bash
# 1. Check database connection
npx prisma db push

# 2. Check migration status
npx prisma migrate status

# 3. View database in GUI
npm run db:studio
```

---

## 🎯 Complete Fresh Start Workflow

```bash
# 1. Reset database
npm run db:reset

# 2. Stop dev server (Ctrl+C)

# 3. Restart dev server
npm run dev

# 4. In browser:
#    - Go to http://localhost:3000
#    - Sign up new account
#    - Create workspace
#    - Create project
#    - Create tasks
```

---

## 🔍 Common Issues After Reset

### Issue: Can't create workspace
**Cause:** Not logged in  
**Fix:** Sign up or sign in first

### Issue: Can't create project
**Cause:** No workspace selected  
**Fix:** Create or join a workspace first

### Issue: Can't create task
**Cause:** Not in a project  
**Fix:** Navigate to a specific project first

### Issue: "workspaceId is null"
**Cause:** User not assigned to workspace  
**Fix:** Create a new workspace or join one

---

## 💡 Pro Tips

1. **Always restart dev server after database operations**
2. **Use `npm run db:studio` to inspect database**
3. **Check browser console for specific errors**
4. **Server logs show detailed error messages**

---

## 🆘 Still Having Issues?

1. Clear browser cache and cookies
2. Check `.env` file for correct `DATABASE_URL`
3. Verify PostgreSQL is running
4. Check server terminal for detailed errors
5. Try `npm run db:reset` again

---

**Last Updated:** After implementing fresh database reset
