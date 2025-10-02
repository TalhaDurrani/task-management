# 🗄️ Database Setup Guide

## Current Situation
Your database was deleted, which is actually **GOOD NEWS**! 🎉

We can now set up a fresh database with the new schema (no organization, updated roles).

---

## 🚀 Quick Database Setup

### Option 1: Start PostgreSQL Service (Recommended)

#### On Windows:
```bash
# If you have PostgreSQL installed via installer:
# Start PostgreSQL service
net start postgresql-x64-16  # or your version number

# Or use pgAdmin to start the service
```

#### On Linux/Mac:
```bash
# Start PostgreSQL
sudo service postgresql start
# or
brew services start postgresql
```

### Option 2: Use Docker (If you have Docker)

```bash
# Start PostgreSQL in Docker
docker run --name postgres-task-management \
  -e POSTGRES_PASSWORD=admin123 \
  -e POSTGRES_DB=task_management \
  -p 5432:5432 \
  -d postgres:15

# Check if it's running
docker ps
```

### Option 3: Create Database Manually

If PostgreSQL is running but database doesn't exist:

```bash
# Using psql command line:
psql -U postgres
# Then in psql:
CREATE DATABASE task_management;
\q

# Or using pgAdmin GUI:
# 1. Open pgAdmin
# 2. Right-click on "Databases"
# 3. Click "Create" > "Database"
# 4. Name: task_management
# 5. Click "Save"
```

---

## ✅ Once PostgreSQL is Running

Run these commands in order:

### Step 1: Initialize Database with New Schema
```bash
npx prisma db push --accept-data-loss
```

This will:
- Create the `task_management` database if it doesn't exist
- Create all tables with the NEW schema:
  - ✅ No organization tables
  - ✅ Workspace with ownerId
  - ✅ User with MEMBER/ADMIN roles only
  - ✅ SubTask with completed field
  - ✅ Task with updatedAt field

### Step 2: Create Migration History
```bash
npx prisma migrate dev --name initial_setup
```

### Step 3: Generate Prisma Client
```bash
npx prisma generate
```

### Step 4: Seed Database (Optional)
Create a test user and workspace:

```bash
# Create seed.ts file first, then:
npx prisma db seed
```

---

## 🧪 Test the Setup

### Start Development Server:
```bash
npm run dev
```

### Test Registration:
1. Go to `http://localhost:3000/auth/register`
2. Create account:
   - Name: Test User
   - Email: test@example.com
   - Password: password123
3. Should automatically:
   - Create user with role `ADMIN`
   - Create workspace: "Test User's Workspace"
   - Set user as workspace owner

### Test Login:
1. Go to `http://localhost:3000/auth/signin`
2. Login with credentials
3. Should redirect to dashboard
4. Check that workspace is loaded

---

## 🔍 Troubleshooting

### "Authentication failed" Error

**Problem:** PostgreSQL not running or wrong credentials

**Solutions:**
1. Check if PostgreSQL is running:
   ```bash
   # Windows
   tasklist | findstr postgres
   
   # Linux/Mac
   ps aux | grep postgres
   ```

2. Check your credentials in `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:admin123@localhost:5432/task_management
   ```
   
   Common password issues:
   - Default password is often `postgres` not `admin123`
   - Check what you set during PostgreSQL installation

3. Test connection:
   ```bash
   npx prisma db execute --stdin < /dev/null
   ```

### "Database does not exist" Error

**Solution:**
```bash
# Let Prisma create it automatically:
npx prisma db push
```

### Port 5432 Already in Use

**Solution:**
```bash
# Find what's using the port
netstat -ano | findstr :5432

# Kill the process or change the port in .env
```

---

## 📋 Common PostgreSQL Commands

```bash
# Check PostgreSQL status
pg_isready

# Connect to PostgreSQL
psql -U postgres

# List all databases
\l

# Connect to task_management database
\c task_management

# List all tables
\dt

# Exit psql
\q
```

---

## 🎯 What You'll Have After Setup

### Database Structure:
```
task_management (database)
├── users (with workspaceId, role: MEMBER or ADMIN)
├── workspaces (with ownerId)
├── projects (linked to workspace)
├── tasks (with updatedAt field)
├── sub_tasks (with completed field)
├── task_assignees
├── comments
├── time_logs
├── timers
├── attachments
├── custom_fields
├── custom_statuses
├── custom_types
└── activities
```

### No More:
- ❌ organizations table
- ❌ organizationId columns
- ❌ SUPER_ADMIN role
- ❌ USER role (now MEMBER)

---

## 💡 Pro Tips

1. **Use pgAdmin** - Visual tool to manage PostgreSQL
   - Download: https://www.pgadmin.org/

2. **Check Connection First**
   ```bash
   npx prisma studio
   ```
   If Prisma Studio opens, connection is good!

3. **Reset Database Anytime**
   ```bash
   npx prisma migrate reset
   # Then:
   npx prisma db push
   ```

---

## 🆘 Still Having Issues?

1. **Verify PostgreSQL Installation:**
   - Windows: Check "Services" for PostgreSQL
   - Check installation directory: `C:\Program Files\PostgreSQL\`

2. **Check Port:**
   - Default: 5432
   - Check your installation settings

3. **Update .env if needed:**
   ```env
   # Try different formats:
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/task_management?schema=public"
   ```

---

**Once PostgreSQL is running, come back and we'll set up the database! 🚀**
