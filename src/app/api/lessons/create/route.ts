import { NextRequest, NextResponse } from 'next/server';
import { createLessonFromUrl, validateLessonCreationRequest, type LessonCreationProgress } from '@/lib/services/lessonService';
import type { CreateLessonRequest, CreateLessonResponse } from '@/lib/types/lesson';

// POST /api/lessons/create - Create a new lesson from YouTube URL
export async function POST(request: NextRequest) {
  try {
    const body: CreateLessonRequest = await request.json();
    
    console.log('Lesson creation request received:', { videoUrl: body.videoUrl });

    // Validate request
    const validation = validateLessonCreationRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          lesson: null,
          success: false,
          message: validation.error
        } as CreateLessonResponse,
        { status: 400 }
      );
    }

    // Create lesson with progress tracking
    const progressUpdates: LessonCreationProgress[] = [];
    
    const result = await createLessonFromUrl(
      body.videoUrl,
      (progress) => {
        progressUpdates.push(progress);
        console.log(`Lesson creation progress: ${progress.step} - ${progress.message} (${progress.progress}%)`);
      }
    );

    if (!result.success || !result.lesson) {
      console.error('Lesson creation failed:', result.error);
      
      return NextResponse.json(
        {
          lesson: null,
          success: false,
          message: result.error || 'Failed to create lesson',
          progress: result.progress
        } as CreateLessonResponse,
        { status: 500 }
      );
    }

    console.log('Lesson created successfully:', result.lesson.id);

    return NextResponse.json({
      lesson: result.lesson,
      success: true,
      message: 'Lesson created successfully',
      progress: result.progress
    } as CreateLessonResponse);

  } catch (error) {
    console.error('Error in lesson creation API:', error);
    
    return NextResponse.json(
      {
        lesson: null,
        success: false,
        message: 'Internal server error during lesson creation'
      } as CreateLessonResponse,
      { status: 500 }
    );
  }
}

// GET /api/lessons/create/test - Test lesson creation with sample data
export async function GET(request: NextRequest) {
  try {
    console.log('Testing lesson creation workflow...');

    // Test with a sample YouTube URL (Rick Roll for testing)
    const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    
    const progressUpdates: LessonCreationProgress[] = [];
    
    const result = await createLessonFromUrl(
      testUrl,
      (progress) => {
        progressUpdates.push(progress);
        console.log(`Test lesson creation: ${progress.step} - ${progress.message} (${progress.progress}%)`);
      }
    );

    return NextResponse.json({
      success: result.success,
      lesson: result.lesson,
      error: result.error,
      progress: result.progress,
      testMode: true,
      testUrl: testUrl,
      message: result.success ? 'Test lesson creation completed successfully' : 'Test lesson creation failed'
    });

  } catch (error) {
    console.error('Error in lesson creation test:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        testMode: true,
        message: 'Test lesson creation failed with error'
      },
      { status: 500 }
    );
  }
}
