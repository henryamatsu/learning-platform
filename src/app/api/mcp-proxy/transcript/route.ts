import { NextRequest, NextResponse } from 'next/server';
import { Supadata, Transcript } from "@supadata/js";

export async function POST(request: NextRequest) {
  try {
    const { videoUrl } = await request.json();

    if (!videoUrl) {
      return NextResponse.json(
        { success: false, error: 'Video URL is required' },
        { status: 400 }
      );
    }

    console.log('Supadata: Extracting transcript for:', videoUrl);

    // Initialize the Supadata client
    const supadata = new Supadata({
      apiKey: process.env.SUPADATA_MCP_API_KEY || process.env.GEMINI_API_KEY,
    });

    // Extract transcript using official SDK
    const transcript: Transcript = await supadata.youtube.transcript({
      url: videoUrl,
    });

    console.log('Supadata transcript result:', transcript);

    if (transcript && transcript.text) {
      return NextResponse.json({
        success: true,
        transcript: transcript.text
      });
    }

    return NextResponse.json({
      success: false,
      error: 'No transcript text found in response'
    }, { status: 500 });

  } catch (error) {
    console.error('Supadata SDK error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Supadata SDK failed' 
      },
      { status: 500 }
    );
  }
}
