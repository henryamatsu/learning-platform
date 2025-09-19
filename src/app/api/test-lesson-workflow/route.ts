import { NextRequest, NextResponse } from 'next/server';
import { 
  createLessonFromUrl, 
  getLessonWithProgress, 
  getAllLessonsWithProgress,
  initializeLessonProgress,
  getLessonStats,
  validateLessonCreationRequest
} from '@/lib/services/lessonService';

// GET /api/test-lesson-workflow - Test complete lesson creation workflow
export async function GET(request: NextRequest) {
  const testResults: any[] = [];
  let allTestsPassed = true;

  try {
    console.log('🧪 Starting lesson creation workflow tests...');

    // Test 1: Validation
    console.log('🧪 Testing lesson creation validation...');
    const validationTests = [
      { videoUrl: '', expectedValid: false },
      { videoUrl: 'invalid-url', expectedValid: false },
      { videoUrl: 'https://vimeo.com/123456', expectedValid: false },
      { videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', expectedValid: true },
      { videoUrl: 'https://youtu.be/dQw4w9WgXcQ', expectedValid: true }
    ];

    const validationResults = validationTests.map(test => {
      const result = validateLessonCreationRequest({ videoUrl: test.videoUrl });
      return {
        url: test.videoUrl,
        expected: test.expectedValid,
        actual: result.valid,
        passed: result.valid === test.expectedValid,
        error: result.error
      };
    });

    const validationPassed = validationResults.every(r => r.passed);

    testResults.push({
      test: 'Lesson Creation Validation',
      passed: validationPassed,
      details: validationResults
    });

    if (!validationPassed) allTestsPassed = false;

    // Test 2: Lesson stats (should work even with no lessons)
    console.log('🧪 Testing lesson statistics...');
    try {
      const stats = await getLessonStats();
      const statsValid = 
        typeof stats.totalLessons === 'number' &&
        typeof stats.totalSections === 'number' &&
        typeof stats.totalQuizzes === 'number' &&
        typeof stats.averageSectionsPerLesson === 'number';

      testResults.push({
        test: 'Lesson Statistics',
        passed: statsValid,
        details: stats
      });

      if (!statsValid) allTestsPassed = false;
    } catch (error) {
      testResults.push({
        test: 'Lesson Statistics',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      allTestsPassed = false;
    }

    // Test 3: Get all lessons (should work even if empty)
    console.log('🧪 Testing lesson retrieval...');
    try {
      const lessons = await getAllLessonsWithProgress();
      const lessonsValid = Array.isArray(lessons);

      testResults.push({
        test: 'Lesson Retrieval',
        passed: lessonsValid,
        details: {
          isArray: Array.isArray(lessons),
          count: lessons.length,
          hasProgressData: lessons.every(l => 'progress' in l)
        }
      });

      if (!lessonsValid) allTestsPassed = false;
    } catch (error) {
      testResults.push({
        test: 'Lesson Retrieval',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      allTestsPassed = false;
    }

    // Test 4: Lesson creation workflow (with mock data)
    console.log('🧪 Testing lesson creation workflow...');
    try {
      const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const progressUpdates: any[] = [];
      
      const result = await createLessonFromUrl(
        testUrl,
        (progress) => {
          progressUpdates.push(progress);
        }
      );

      const workflowPassed = 
        result.success &&
        result.lesson &&
        result.lesson.id &&
        result.lesson.title &&
        result.lesson.sections &&
        result.lesson.sections.length > 0 &&
        progressUpdates.length > 0;

      testResults.push({
        test: 'Lesson Creation Workflow',
        passed: workflowPassed,
        details: {
          success: result.success,
          hasLesson: !!result.lesson,
          lessonId: result.lesson?.id,
          sectionCount: result.lesson?.sections.length || 0,
          progressUpdates: progressUpdates.length,
          finalStep: progressUpdates[progressUpdates.length - 1]?.step,
          error: result.error
        }
      });

      if (!workflowPassed) allTestsPassed = false;

      // Test 5: Progress initialization (if lesson was created)
      if (result.success && result.lesson) {
        console.log('🧪 Testing progress initialization...');
        try {
          const progressInit = await initializeLessonProgress(result.lesson.id);
          const progressInitPassed = progressInit === true;

          testResults.push({
            test: 'Progress Initialization',
            passed: progressInitPassed,
            details: {
              initialized: progressInit,
              lessonId: result.lesson.id
            }
          });

          if (!progressInitPassed) allTestsPassed = false;

          // Test 6: Lesson retrieval with progress
          console.log('🧪 Testing lesson retrieval with progress...');
          try {
            const lessonWithProgress = await getLessonWithProgress(result.lesson.id);
            const retrievalPassed = 
              lessonWithProgress !== null &&
              lessonWithProgress.lesson &&
              lessonWithProgress.lesson.id === result.lesson.id;

            testResults.push({
              test: 'Lesson Retrieval with Progress',
              passed: retrievalPassed,
              details: {
                found: lessonWithProgress !== null,
                hasLesson: !!lessonWithProgress?.lesson,
                hasProgress: !!lessonWithProgress?.progress,
                lessonId: lessonWithProgress?.lesson?.id
              }
            });

            if (!retrievalPassed) allTestsPassed = false;
          } catch (error) {
            testResults.push({
              test: 'Lesson Retrieval with Progress',
              passed: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            allTestsPassed = false;
          }
        } catch (error) {
          testResults.push({
            test: 'Progress Initialization',
            passed: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          allTestsPassed = false;
        }
      }

    } catch (error) {
      testResults.push({
        test: 'Lesson Creation Workflow',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      allTestsPassed = false;
    }

    // Summary
    const passedTests = testResults.filter(r => r.passed).length;
    const totalTests = testResults.length;

    return NextResponse.json({
      success: allTestsPassed,
      message: `Lesson creation workflow tests completed: ${passedTests}/${totalTests} passed`,
      summary: {
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        allTestsPassed
      },
      tests: testResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Lesson creation workflow test failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Lesson creation workflow test suite failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        tests: testResults
      },
      { status: 500 }
    );
  }
}
