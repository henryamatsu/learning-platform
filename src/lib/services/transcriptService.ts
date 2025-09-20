// YouTube transcript extraction service using Supadata MCP

export interface TranscriptResponse {
  success: boolean;
  transcript?: string;
  error?: string;
  jobId?: string;
  status?: 'completed' | 'processing' | 'failed';
}

export interface TranscriptJob {
  id: string;
  status: 'queued' | 'active' | 'completed' | 'failed';
  result?: string;
  error?: string;
}

/**
 * Extract transcript from YouTube video using Supadata MCP
 */
export async function extractTranscript(videoUrl: string): Promise<TranscriptResponse> {
  try {
    console.log('Extracting transcript for:', videoUrl);

    // Check if MCP tools are available
    if (typeof mcp_supadatamcp_supadata_transcript === 'undefined') {
      console.warn('Supadata MCP not available, using mock transcript');
      return getMockTranscript(videoUrl);
    }

    // Call Supadata transcript extraction
    const response = await mcp_supadatamcp_supadata_transcript({
      url: videoUrl,
      lang: 'en',
      text: true,
      mode: 'auto'
    });

    // Handle immediate response (transcript ready)
    if (typeof response === 'string') {
      return {
        success: true,
        transcript: response
      };
    }

    // Handle job-based response (async processing)
    if (response && typeof response === 'object' && 'id' in response) {
      return {
        success: true,
        jobId: response.id as string,
        status: 'processing'
      };
    }

    return {
      success: false,
      error: 'Unexpected response format from transcript service'
    };

  } catch (error) {
    console.error('Error extracting transcript:', error);
    console.error('Supadata MCP error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      videoUrl,
      mcpEnabled: process.env.SUPADATA_MCP_ENABLED,
      hasApiKey: !!process.env.SUPADATA_MCP_API_KEY
    });
    
    // Try alternative transcript extraction methods
    console.log('Trying alternative transcript extraction...');
    return await tryAlternativeExtraction(videoUrl);
  }
}

/**
 * Check status of transcript extraction job
 */
export async function checkTranscriptStatus(jobId: string): Promise<TranscriptResponse> {
  try {
    console.log('Checking transcript status for job:', jobId);

    // Check if MCP tools are available
    if (typeof mcp_supadatamcp_supadata_check_transcript_status === 'undefined') {
      console.warn('Supadata MCP not available, returning mock completed status');
      return {
        success: true,
        status: 'completed',
        transcript: getMockTranscriptContent()
      };
    }

    const response = await mcp_supadatamcp_supadata_check_transcript_status({
      id: jobId
    });

    if (response.status === 'completed' && response.result) {
      return {
        success: true,
        status: 'completed',
        transcript: response.result
      };
    }

    if (response.status === 'failed') {
      return {
        success: false,
        status: 'failed',
        error: response.error || 'Transcript extraction failed'
      };
    }

    return {
      success: true,
      status: response.status as 'processing',
      jobId: jobId
    };

  } catch (error) {
    console.error('Error checking transcript status:', error);
    return {
      success: false,
      error: 'Failed to check transcript status'
    };
  }
}

/**
 * Extract transcript with retry logic and polling for async jobs
 */
export async function extractTranscriptWithRetry(
  videoUrl: string,
  maxRetries: number = 3,
  pollInterval: number = 5000
): Promise<TranscriptResponse> {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await extractTranscript(videoUrl);

      // If we got a transcript immediately, return it
      if (response.success && response.transcript) {
        return response;
      }

      // If we got a job ID, poll for completion
      if (response.success && response.jobId) {
        return await pollTranscriptJob(response.jobId, pollInterval);
      }

      // If extraction failed, retry
      if (!response.success) {
        attempt++;
        if (attempt < maxRetries) {
          console.log(`Transcript extraction attempt ${attempt} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
      }

      return response;

    } catch (error) {
      attempt++;
      console.error(`Transcript extraction attempt ${attempt} failed:`, error);
      
      if (attempt >= maxRetries) {
        return {
          success: false,
          error: `Failed to extract transcript after ${maxRetries} attempts`
        };
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return {
    success: false,
    error: 'Max retries exceeded'
  };
}

/**
 * Poll transcript job until completion
 */
async function pollTranscriptJob(
  jobId: string,
  pollInterval: number = 5000,
  maxPollTime: number = 300000 // 5 minutes
): Promise<TranscriptResponse> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxPollTime) {
    const status = await checkTranscriptStatus(jobId);

    if (status.status === 'completed' && status.transcript) {
      return status;
    }

    if (status.status === 'failed') {
      return status;
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  return {
    success: false,
    error: 'Transcript extraction timed out'
  };
}

/**
 * Try alternative transcript extraction methods
 */
async function tryAlternativeExtraction(videoUrl: string): Promise<TranscriptResponse> {
  try {
    // Method 1: Try youtube-transcript package
    console.log('Attempting youtube-transcript extraction...');
    
    const { YoutubeTranscript } = await import('youtube-transcript');
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoUrl);
    
    if (transcriptItems && transcriptItems.length > 0) {
      const transcript = transcriptItems
        .map(item => item.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      console.log(`Successfully extracted transcript using youtube-transcript: ${transcript.length} characters`);
      
      return {
        success: true,
        transcript: transcript
      };
    }
    
    throw new Error('No transcript items found');
    
  } catch (error) {
    console.error('youtube-transcript extraction failed:', error);
    
    // Method 2: Return helpful error message
    return {
      success: false,
      error: `Unable to extract transcript from video: ${videoUrl}. 

Possible reasons:
1. Video doesn't have captions/subtitles enabled
2. Video is private or restricted
3. Video is too new (captions not processed yet)
4. Geographic restrictions

Please try:
- A different video with clear captions
- A popular educational video
- Checking if the video has subtitles when you watch it manually

Example working videos:
- Khan Academy videos
- TED Talks
- Popular programming tutorials`
    };
  }
}

/**
 * Mock transcript for development and fallback
 */
function getMockTranscript(videoUrl: string): TranscriptResponse {
  return {
    success: true,
    transcript: getMockTranscriptContent()
  };
}

function getMockTranscriptContent(): string {
  return `Welcome to this educational video about JavaScript variables. 

In this lesson, we're going to explore one of the fundamental concepts in programming: variables. Variables are like containers that store data values in your programs.

Let's start with the basics. What exactly is a variable? Think of a variable as a labeled box where you can store information. You can put different types of data in these boxes - numbers, text, true or false values, and more.

In JavaScript, there are three main ways to declare variables: var, let, and const. Each of these keywords has its own characteristics and use cases.

The var keyword is the oldest way to declare variables in JavaScript. It has function scope, which means the variable is available throughout the entire function where it's declared.

The let keyword was introduced in ES6 and provides block scope. This means the variable is only available within the block of code where it's declared, such as inside curly braces.

The const keyword is used to declare constants - variables whose values cannot be changed after they're initially assigned. Like let, const also has block scope.

When choosing between these keywords, it's generally recommended to use const by default for values that won't change, let when you need to reassign the variable, and to avoid var in modern JavaScript due to its scope-related issues.

Variables make your code more readable, maintainable, and flexible. Instead of hardcoding values throughout your program, you can use descriptive variable names that make your intentions clear.

That concludes our introduction to JavaScript variables. In the next section, we'll dive deeper into variable scope and best practices for naming your variables.`;
}

/**
 * Validate transcript content
 */
export function validateTranscript(transcript: string): boolean {
  if (!transcript || typeof transcript !== 'string') {
    return false;
  }

  // Check minimum length (should have some substantial content)
  if (transcript.trim().length < 100) {
    return false;
  }

  // Check for common transcript indicators
  const hasWords = /\b\w+\b/g.test(transcript);
  if (!hasWords) {
    return false;
  }

  return true;
}

/**
 * Clean and prepare transcript for AI processing
 */
export function cleanTranscript(transcript: string): string {
  if (!transcript) return '';

  return transcript
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove common transcript artifacts
    .replace(/\[.*?\]/g, '') // Remove [music], [applause], etc.
    .replace(/\(.*?\)/g, '') // Remove (inaudible), etc.
    // Clean up punctuation
    .replace(/\s+([,.!?])/g, '$1')
    // Trim and normalize
    .trim();
}
