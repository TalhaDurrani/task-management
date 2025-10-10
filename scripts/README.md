# Database Management Scripts

This folder contains scripts to manage your database.

## Available Scripts

### 🗑️ Clean Database (Delete All Data)
Removes all data from all tables while keeping the schema intact.

```bash
npm run db:clean
# or
node scripts/clean-database.js
```

**Use this when you want to:**
- Remove all data but keep the database structure
- Start fresh without recreating tables
- Quick cleanup without migrations

---

### 🔄 Reset Database (Complete Reset)
Drops all tables, recreates schema from migrations, and optionally seeds data.

```bash
# Reset with sample data
npm run db:reset

# Reset without sample data
npm run db:reset:clean
```

**Use this when you want to:**
- Complete fresh start (schema + data)
- Apply new migrations from scratch
- Fix schema inconsistencies

---

### 📊 Other Database Commands

```bash
# Push schema changes to database
npm run db:push

# Seed database with sample data
npm run db:seed

# Open Prisma Studio (GUI for database)
npm run db:studio
```

---

## ⚠️ WARNING

**Both clean and reset scripts will DELETE ALL DATA!**

These operations:
- Cannot be undone
- Will remove all users, workspaces, projects, tasks, etc.
- Should NEVER be run on production

Make sure you have backups if you need to preserve any data!

---

## What Each Script Does

### `clean-database.js`
1. Deletes all data from all tables (in correct order)
2. Preserves database schema
3. Fast and safe (respects foreign keys)

### `reset-database.js`
1. Drops all tables completely
2. Runs Prisma migrations to recreate schema
3. Generates Prisma Client
4. Optionally seeds sample data
5. Asks for confirmation before proceeding

---

## Examples

**Scenario 1: Testing with fresh data**
```bash
npm run db:clean
npm run db:seed
```

**Scenario 2: Complete reset after schema changes**
```bash
npm run db:reset
```

**Scenario 3: Reset without any seed data**
```bash
npm run db:reset:clean
```

---

## After Reset

After running these scripts:
1. Your database will be empty (or have seed data)
2. Start your dev server: `npm run dev`
3. Create a new user or login with seed credentials
4. Create workspaces and projects

---

## Troubleshooting

**Script fails with permission error:**
- Make sure your database server is running
- Check your `.env` file has correct `DATABASE_URL`

**Migration errors after reset:**
- Run `npx prisma migrate dev` to apply migrations
- Or use `npx prisma db push` to sync schema

**Seed script not found:**
- Create `prisma/seed.ts` if it doesn't exist
- Add `prisma.seed` config to `package.json`
