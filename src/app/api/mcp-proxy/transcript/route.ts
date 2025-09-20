import { NextRequest, NextResponse } from "next/server";
import { Supadata } from "@supadata/js";

export async function POST(request: NextRequest) {
  try {
    const { videoUrl } = await request.json();

    if (!videoUrl) {
      return NextResponse.json(
        { success: false, error: "Video URL is required" },
        { status: 400 }
      );
    }

    console.log("Supadata: Extracting transcript for:", videoUrl);

    // Initialize the Supadata client
    const supadata = new Supadata({
      apiKey: process.env.SUPADATA_MCP_API_KEY!,
    });

    console.log("Supadata API key:", process.env.SUPADATA_MCP_API_KEY);

    // Extract transcript using official SDK
    const transcript = await supadata.transcript({
      url: videoUrl,
      lang: "en",
      text: true,
      mode: "auto",
    });

    // console.log("Supadata transcript result:", transcript);

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
          return NextResponse.json({
            success: true,
            transcript: content,
          });
        }
      } else if (jobResult.status === "failed") {
        return NextResponse.json(
          {
            success: false,
            error: jobResult.error || "Transcript job failed",
          },
          { status: 500 }
        );
      } else {
        // Job is still processing
        return NextResponse.json(
          {
            success: false,
            error: `Transcript job status: ${jobResult.status}. Please try again later.`,
          },
          { status: 202 }
        );
      }
    } else {
      // For smaller files or native transcripts, we get the result directly
      if (transcript && transcript.content) {
        return NextResponse.json({
          success: true,
          transcript: transcript.content,
        });
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "No transcript content found in response",
      },
      { status: 500 }
    );
  } catch (error) {
    console.error("Supadata SDK error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Supadata SDK failed",
      },
      { status: 500 }
    );
  }
}
