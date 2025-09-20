import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { videoUrl } = await request.json();

    if (!videoUrl) {
      return NextResponse.json(
        { success: false, error: 'Video URL is required' },
        { status: 400 }
      );
    }

    console.log('MCP Proxy: Extracting transcript for:', videoUrl);

    // Make direct API call to Supadata
    const supadataResponse = await fetch('https://api.supadata.ai/v1/transcript', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPADATA_MCP_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: videoUrl,
        lang: 'en',
        text: true,
        mode: 'auto'
      })
    });

    const supadataData = await supadataResponse.json();

    if (supadataResponse.ok && supadataData.transcript) {
      return NextResponse.json({
        success: true,
        transcript: supadataData.transcript
      });
    }

    return NextResponse.json({
      success: false,
      error: supadataData.error || 'Supadata API call failed'
    }, { status: 500 });

  } catch (error) {
    console.error('MCP Proxy error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'MCP proxy failed' 
      },
      { status: 500 }
    );
  }
}
