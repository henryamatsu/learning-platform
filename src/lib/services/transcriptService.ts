// YouTube transcript extraction service using Supadata MCP

// Declare MCP functions as global
declare global {
  function mcp_supadatamcp_supadata_transcript(params: {
    url: string;
    lang?: string;
    text?: boolean;
    mode?: string;
  }): Promise<any>;
  
  function mcp_supadatamcp_supadata_check_transcript_status(params: {
    id: string;
  }): Promise<any>;
}

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

  // Use Supadata MCP directly - it should be available

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
    
    // MCP failed, return error
    throw error;
  }
}

/**
 * Check status of transcript extraction job
 */
export async function checkTranscriptStatus(jobId: string): Promise<TranscriptResponse> {
  try {
    console.log('Checking transcript status for job:', jobId);

    // Use Supadata MCP directly

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
