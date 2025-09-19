import { NextRequest, NextResponse } from 'next/server';
import { extractTranscriptWithRetry, validateTranscript, cleanTranscript } from '@/lib/services/transcriptService';
import { parseYouTubeUrl, isValidYouTubeUrl } from '@/lib/utils/youtube';

export interface TranscriptApiResponse {
  success: boolean;
  transcript?: string;
  videoId?: string;
  message?: string;
  error?: string;
}

// POST /api/transcript - Extract transcript from YouTube video
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoUrl } = body;

    // Validate input
    if (!videoUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Video URL is required'
        } as TranscriptApiResponse,
        { status: 400 }
      );
    }

    // Validate YouTube URL
    if (!isValidYouTubeUrl(videoUrl)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid YouTube URL format'
        } as TranscriptApiResponse,
        { status: 400 }
      );
    }

    // Parse YouTube URL
    const videoInfo = parseYouTubeUrl(videoUrl);
    console.log('Extracting transcript for video:', videoInfo.videoId);

    // Extract transcript with retry logic
    const transcriptResponse = await extractTranscriptWithRetry(videoUrl, 3, 5000);

    if (!transcriptResponse.success || !transcriptResponse.transcript) {
      return NextResponse.json(
        {
          success: false,
          error: transcriptResponse.error || 'Failed to extract transcript',
          videoId: videoInfo.videoId
        } as TranscriptApiResponse,
        { status: 500 }
      );
    }

    // Validate transcript content
    if (!validateTranscript(transcriptResponse.transcript)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or insufficient transcript content',
          videoId: videoInfo.videoId
        } as TranscriptApiResponse,
        { status: 422 }
      );
    }

    // Clean transcript for processing
    const cleanedTranscript = cleanTranscript(transcriptResponse.transcript);

    return NextResponse.json({
      success: true,
      transcript: cleanedTranscript,
      videoId: videoInfo.videoId,
      message: 'Transcript extracted successfully'
    } as TranscriptApiResponse);

  } catch (error) {
    console.error('Error in transcript API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during transcript extraction'
      } as TranscriptApiResponse,
      { status: 500 }
    );
  }
}

// GET /api/transcript?url=VIDEO_URL - Alternative GET endpoint for transcript extraction
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoUrl = searchParams.get('url');

    if (!videoUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Video URL parameter is required'
        } as TranscriptApiResponse,
        { status: 400 }
      );
    }

    // Validate YouTube URL
    if (!isValidYouTubeUrl(videoUrl)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid YouTube URL format'
        } as TranscriptApiResponse,
        { status: 400 }
      );
    }

    // Parse YouTube URL
    const videoInfo = parseYouTubeUrl(videoUrl);
    console.log('Extracting transcript for video:', videoInfo.videoId);

    // Extract transcript with retry logic
    const transcriptResponse = await extractTranscriptWithRetry(videoUrl, 3, 5000);

    if (!transcriptResponse.success || !transcriptResponse.transcript) {
      return NextResponse.json(
        {
          success: false,
          error: transcriptResponse.error || 'Failed to extract transcript',
          videoId: videoInfo.videoId
        } as TranscriptApiResponse,
        { status: 500 }
      );
    }

    // Validate and clean transcript
    if (!validateTranscript(transcriptResponse.transcript)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or insufficient transcript content',
          videoId: videoInfo.videoId
        } as TranscriptApiResponse,
        { status: 422 }
      );
    }

    const cleanedTranscript = cleanTranscript(transcriptResponse.transcript);

    return NextResponse.json({
      success: true,
      transcript: cleanedTranscript,
      videoId: videoInfo.videoId,
      message: 'Transcript extracted successfully'
    } as TranscriptApiResponse);

  } catch (error) {
    console.error('Error in transcript GET API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during transcript extraction'
      } as TranscriptApiResponse,
      { status: 500 }
    );
  }
}
