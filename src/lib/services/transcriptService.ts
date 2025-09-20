// YouTube transcript extraction service using Supadata SDK
import { Supadata } from "@supadata/js";

export interface TranscriptResponse {
  success: boolean;
  transcript?: string;
  error?: string;
  jobId?: string;
  status?: "completed" | "processing" | "failed";
}

export interface TranscriptJob {
  id: string;
  status: "queued" | "active" | "completed" | "failed";
  result?: string;
  error?: string;
}

/**
 * Extract transcript from YouTube video using Supadata SDK directly
 */
export async function extractTranscript(
  videoUrl: string
): Promise<TranscriptResponse> {
  try {
    console.log("Supadata: Extracting transcript for:", videoUrl);
    console.log("Supadata API key:", process.env.SUPADATA_MCP_API_KEY);

    // Initialize the Supadata client
    const supadata = new Supadata({
      apiKey: process.env.SUPADATA_MCP_API_KEY!,
    });

    // Extract transcript using official SDK
    const transcript = await supadata.transcript({
      url: videoUrl,
      lang: "en",
      text: true,
      mode: "auto",
    });

    console.log("Supadata transcript result:", transcript);

    // Check if we got a transcript directly or a job ID for async processing
    if ("jobId" in transcript) {
      // For large files, we get a job ID and need to poll for results
      const jobResult = await supadata.transcript.getJobStatus(
        transcript.jobId
      );

      console.log("Supadata job result:", jobResult);
      if (jobResult.status === "completed") {
        // Try to access the content directly from jobResult
        const content =
          (jobResult as any).content ||
          (jobResult as any).data?.content ||
          (jobResult as any).result?.content;
        if (content) {
          return {
            success: true,
            transcript: content,
          };
        }
      } else if (jobResult.status === "failed") {
        throw new Error(jobResult.error || "Transcript job failed");
      } else {
        // Job is still processing, return job ID for polling
        return {
          success: true,
          jobId: transcript.jobId,
          status: "processing",
        };
      }
    } else {
      // For smaller files or native transcripts, we get the result directly
      if (transcript && transcript.content) {
        return {
          success: true,
          transcript: transcript.content,
        };
      }
    }

    throw new Error("No transcript content found in response");
  } catch (error) {
    console.error("Supadata SDK error:", error);
    console.error("Supadata error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      videoUrl,
      hasApiKey: !!process.env.SUPADATA_MCP_API_KEY,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Supadata SDK failed",
    };
  }
}

/**
 * Check status of transcript extraction job using Supadata SDK
 */
export async function checkTranscriptStatus(
  jobId: string
): Promise<TranscriptResponse> {
  try {
    console.log("Checking transcript status for job:", jobId);

    // Initialize the Supadata client
    const supadata = new Supadata({
      apiKey: process.env.SUPADATA_MCP_API_KEY!,
    });

    const response = await supadata.transcript.getJobStatus(jobId);

    if (response.status === "completed") {
      // Try to access the content from different possible locations
      const content =
        (response as any).content ||
        (response as any).data?.content ||
        (response as any).result?.content;
      if (content) {
        return {
          success: true,
          status: "completed",
          transcript: content,
        };
      }
    }

    if (response.status === "failed") {
      return {
        success: false,
        status: "failed",
        error: response.error || "Transcript extraction failed",
      };
    }

    return {
      success: true,
      status: response.status as "processing",
      jobId: jobId,
    };
  } catch (error) {
    console.error("Error checking transcript status:", error);
    return {
      success: false,
      error: "Failed to check transcript status",
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
          console.log(
            `Transcript extraction attempt ${attempt} failed, retrying...`
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));
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
          error: `Failed to extract transcript after ${maxRetries} attempts`,
        };
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return {
    success: false,
    error: "Max retries exceeded",
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

    if (status.status === "completed" && status.transcript) {
      return status;
    }

    if (status.status === "failed") {
      return status;
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  return {
    success: false,
    error: "Transcript extraction timed out",
  };
}

/**
 * Validate transcript content
 */
export function validateTranscript(transcript: string): boolean {
  if (!transcript || typeof transcript !== "string") {
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
  if (!transcript) return "";

  return (
    transcript
      // Remove excessive whitespace
      .replace(/\s+/g, " ")
      // Remove common transcript artifacts
      .replace(/\[.*?\]/g, "") // Remove [music], [applause], etc.
      .replace(/\(.*?\)/g, "") // Remove (inaudible), etc.
      // Clean up punctuation
      .replace(/\s+([,.!?])/g, "$1")
      // Trim and normalize
      .trim()
  );
}
