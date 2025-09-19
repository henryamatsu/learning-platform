import { NextRequest, NextResponse } from 'next/server';
import { generateContentWithRetry, validateGeneratedContent, determineSectionCount } from '@/lib/services/aiService';
import { validateTranscript, cleanTranscript } from '@/lib/services/transcriptService';
import { parseYouTubeUrl } from '@/lib/utils/youtube';

export interface AIGenerateRequest {
  transcript: string;
  videoTitle?: string;
  videoUrl?: string;
  sectionCount?: number;
}

export interface AIGenerateResponse {
  success: boolean;
  lesson?: any;
  error?: string;
  metadata?: {
    transcriptLength: number;
    sectionCount: number;
    processingTime: number;
    videoId?: string;
  };
}

// POST /api/ai-generate - Generate lesson content from transcript using AI
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body: AIGenerateRequest = await request.json();
    const { transcript, videoTitle, videoUrl, sectionCount } = body;

    // Validate input
    if (!transcript) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transcript is required'
        } as AIGenerateResponse,
        { status: 400 }
      );
    }

    // Validate transcript content
    if (!validateTranscript(transcript)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or insufficient transcript content'
        } as AIGenerateResponse,
        { status: 400 }
      );
    }

    // Clean transcript for processing
    const cleanedTranscript = cleanTranscript(transcript);
    console.log(`Processing transcript of ${cleanedTranscript.length} characters`);

    // Determine section count if not provided
    const finalSectionCount = sectionCount || determineSectionCount(cleanedTranscript);
    console.log(`Generating ${finalSectionCount} sections`);

    // Extract video ID if URL provided
    let videoId: string | undefined;
    if (videoUrl) {
      const videoInfo = parseYouTubeUrl(videoUrl);
      videoId = videoInfo.isValid ? videoInfo.videoId : undefined;
    }

    // Generate lesson content with AI
    const generationResult = await generateContentWithRetry(
      cleanedTranscript,
      videoTitle,
      3 // max retries
    );

    if (!generationResult.success || !generationResult.lesson) {
      return NextResponse.json(
        {
          success: false,
          error: generationResult.error || 'Failed to generate lesson content',
          metadata: {
            transcriptLength: cleanedTranscript.length,
            sectionCount: finalSectionCount,
            processingTime: Date.now() - startTime,
            videoId
          }
        } as AIGenerateResponse,
        { status: 500 }
      );
    }

    // Validate generated content
    if (!validateGeneratedContent(generationResult.lesson)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Generated content failed validation checks',
          metadata: {
            transcriptLength: cleanedTranscript.length,
            sectionCount: finalSectionCount,
            processingTime: Date.now() - startTime,
            videoId
          }
        } as AIGenerateResponse,
        { status: 422 }
      );
    }

    const processingTime = Date.now() - startTime;
    console.log(`Lesson generation completed in ${processingTime}ms`);

    return NextResponse.json({
      success: true,
      lesson: generationResult.lesson,
      metadata: {
        transcriptLength: cleanedTranscript.length,
        sectionCount: generationResult.lesson.sections.length,
        processingTime,
        videoId
      }
    } as AIGenerateResponse);

  } catch (error) {
    console.error('Error in AI generation API:', error);
    
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during AI content generation',
        metadata: {
          transcriptLength: 0,
          sectionCount: 0,
          processingTime
        }
      } as AIGenerateResponse,
      { status: 500 }
    );
  }
}

// GET /api/ai-generate/test - Test AI generation with sample data
export async function GET(request: NextRequest) {
  try {
    const sampleTranscript = `Welcome to this comprehensive introduction to JavaScript variables. In this lesson, we'll explore one of the most fundamental concepts in programming.

Variables are like containers that store data values in your JavaScript programs. Think of them as labeled boxes where you can put different types of information and retrieve them later when needed.

There are three main ways to declare variables in JavaScript: var, let, and const. Each of these keywords has its own characteristics and use cases.

The var keyword is the oldest way to declare variables in JavaScript. It has function scope, which means the variable is available throughout the entire function where it's declared.

The let keyword was introduced in ES6 and provides block scope. This means the variable is only available within the block of code where it's declared.

The const keyword is used to declare constants - variables whose values cannot be changed after they're initially assigned.

When choosing between these keywords, it's generally recommended to use const by default for values that won't change, let when you need to reassign the variable, and to avoid var in modern JavaScript.

Variables make your code more readable, maintainable, and flexible. Instead of hardcoding values throughout your program, you can use descriptive variable names that make your intentions clear.

Understanding variable scope is crucial for writing effective JavaScript code. Scope determines where in your code a variable can be accessed.

Best practices for naming variables include using descriptive names, following camelCase convention, and avoiding reserved keywords.

That concludes our comprehensive introduction to JavaScript variables. Practice these concepts to build a strong foundation for your programming journey.`;

    console.log('Testing AI generation with sample transcript...');

    const result = await generateContentWithRetry(
      sampleTranscript,
      'Introduction to JavaScript Variables - Complete Guide'
    );

    return NextResponse.json({
      success: result.success,
      lesson: result.lesson,
      error: result.error,
      metadata: {
        transcriptLength: sampleTranscript.length,
        sectionCount: result.lesson?.sections.length || 0,
        processingTime: 0,
        testMode: true
      }
    } as AIGenerateResponse);

  } catch (error) {
    console.error('Error in AI generation test:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Test failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
        metadata: {
          transcriptLength: 0,
          sectionCount: 0,
          processingTime: 0,
          testMode: true
        }
      } as AIGenerateResponse,
      { status: 500 }
    );
  }
}
