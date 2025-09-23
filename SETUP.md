# TaskFlow Setup Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/taskflow_db"

# JWT Secret (generate a secure random string)
JWT_SECRET="your-super-secret-jwt-key-here"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-here"

# Optional: Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=""
```

## Database Setup

1. Install PostgreSQL
2. Create a database named `taskflow_db`
3. Update the `DATABASE_URL` in your `.env.local` file
4. Run database migrations:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

## Default Credentials

After setup, you can use these default credentials:

- **Super Admin**: superadmin@taskflow.com / password123
- **Admin**: admin@taskflow.com / password123
- **User**: user@taskflow.com / password123

## Development

```bash
npm install
npm run dev
```

The application will be available at http://localhost:3000
