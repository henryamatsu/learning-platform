# Turso Database Setup

## Step 1: Create Turso Database via Web Dashboard

1. Go to https://app.turso.tech/
2. Sign in with your GitHub account
3. Click "Create Database"
4. Name it "learning-app"
5. Choose a region (closest to your users)

## Step 2: Get Database Credentials

1. Click on your "learning-app" database
2. Copy the **Database URL** (looks like: `libsql://learning-app-[username].turso.io`)
3. Go to "Settings" tab
4. Click "Create Token"
5. Copy the **Auth Token**

## Step 3: Add to Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Go to Settings → Environment Variables
3. Add these two variables:
   ```
   TURSO_DATABASE_URL=libsql://learning-app-[username].turso.io
   TURSO_AUTH_TOKEN=your-auth-token-here
   ```

## Step 4: Push Database Schema

You need to push your Prisma schema to the Turso database. You can do this either:

### Option A: From Turso Web Dashboard

1. Go to your database in the Turso dashboard
2. Click "Data" tab
3. Run this SQL to create the tables:

```sql
-- Copy the SQL from running: npx prisma db push --dry-run
```

### Option B: Set env vars locally and push

1. Create a `.env.local` file with your Turso credentials
2. Run: `npx prisma db push`

The database needs to have the tables created before your app can query it!
