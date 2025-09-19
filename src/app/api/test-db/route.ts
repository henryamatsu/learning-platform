import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/test-db - Test database connection and basic operations
export async function GET(request: NextRequest) {
  try {
    // Test 1: Database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Test 2: Create a test lesson
    const testLesson = await prisma.lesson.create({
      data: {
        title: 'Test Lesson - Database Connection',
        videoUrl: 'https://www.youtube.com/watch?v=test123',
        videoId: 'test123',
        sections: {
          create: [
            {
              title: 'Test Section 1',
              summary: 'This is a test section to verify database operations',
              content: 'Test content for database verification',
              learningObjectives: JSON.stringify(['Test objective 1', 'Test objective 2']),
              order: 1,
              quiz: {
                create: {
                  questions: JSON.stringify([
                    {
                      question: 'What is this test for?',
                      options: ['Database testing', 'UI testing', 'API testing', 'All of the above'],
                      correctAnswer: 0,
                      explanation: 'This is specifically for testing database operations'
                    }
                  ])
                }
              }
            }
          ]
        }
      },
      include: {
        sections: {
          include: {
            quiz: true
          }
        }
      }
    });
    console.log('✅ Test lesson created successfully');

    // Test 3: Read the lesson back
    const retrievedLesson = await prisma.lesson.findUnique({
      where: { id: testLesson.id },
      include: {
        sections: {
          include: {
            quiz: true
          }
        }
      }
    });
    console.log('✅ Test lesson retrieved successfully');

    // Test 4: Create progress tracking
    const testProgress = await prisma.userProgress.create({
      data: {
        userId: 'test-user',
        lessonId: testLesson.id,
        totalSections: 1,
        completedSections: 0
      }
    });
    console.log('✅ Test progress created successfully');

    // Test 5: Update progress
    const updatedProgress = await prisma.userProgress.update({
      where: { id: testProgress.id },
      data: {
        completedSections: 1,
        completedAt: new Date()
      }
    });
    console.log('✅ Test progress updated successfully');

    // Test 6: Clean up - delete test data
    await prisma.userProgress.delete({
      where: { id: testProgress.id }
    });
    await prisma.lesson.delete({
      where: { id: testLesson.id }
    });
    console.log('✅ Test data cleaned up successfully');

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: 'All database tests passed successfully!',
      tests: [
        '✅ Database connection',
        '✅ Lesson creation with sections and quiz',
        '✅ Lesson retrieval',
        '✅ Progress tracking creation',
        '✅ Progress tracking update',
        '✅ Data cleanup'
      ]
    });

  } catch (error) {
    console.error('❌ Database test failed:', error);
    
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError);
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Database test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
