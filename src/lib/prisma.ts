import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient, type Client } from "@libsql/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create database client for production, fallback to local SQLite for development
function createPrismaClient() {
  console.log("Environment check:", {
    NODE_ENV: process.env.NODE_ENV,
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL ? "SET" : "NOT SET",
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? "SET" : "NOT SET",
    DATABASE_URL: process.env.DATABASE_URL,
  });

  // Use Turso if environment variables are available (regardless of NODE_ENV)
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    // Production: Use Turso (hosted libSQL)
    console.log("✅ Using Turso database:", process.env.TURSO_DATABASE_URL);
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    const adapter = new PrismaLibSQL(libsql as any);
    return new PrismaClient({ adapter });
  }

  // Development: Use local SQLite
  console.log("❌ Using local SQLite database - Turso env vars not found");
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || "file:./dev.db",
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
