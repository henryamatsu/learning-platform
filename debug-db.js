// Quick debug script to test database connection
const { PrismaClient } = require('@prisma/client');

console.log('Environment variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('TURSO_DATABASE_URL:', process.env.TURSO_DATABASE_URL);
console.log('TURSO_AUTH_TOKEN:', process.env.TURSO_AUTH_TOKEN ? 'SET' : 'NOT SET');

async function testConnection() {
  try {
    // Test with basic Prisma client (local SQLite)
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || "file:./prisma/dev.db",
        },
      },
    });

    console.log('\nTesting database connection...');
    const lessonCount = await prisma.lesson.count();
    console.log('✅ Database connected! Lesson count:', lessonCount);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testConnection();
