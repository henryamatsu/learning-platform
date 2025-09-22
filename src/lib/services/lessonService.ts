// Lesson Service - Business logic for lesson management

import { prisma } from "@/lib/prisma";
import { extractTranscriptWithRetry } from "./transcriptService";
import { generateContentWithRetry } from "./aiService";
import { parseYouTubeUrl, normalizeYouTubeUrl } from "@/lib/utils/youtube";
import type { Lesson, CreateLessonRequest } from "@/lib/types/lesson";

export interface LessonCreationProgress {
  step:
    | "validating"
    | "extracting"
    | "generating"
    | "saving"
    | "completed"
    | "error";
  message: string;
  progress: number; // 0-100
  error?: string;
}

export interface LessonCreationResult {
  success: boolean;
  lesson?: Lesson;
  error?: string;
  progress?: LessonCreationProgress[];
}

/**
 * Create a complete lesson from a YouTube URL
 * This orchestrates the entire workflow: URL validation -> transcript extraction -> AI generation -> database storage
 */
export async function createLessonFromUrl(
  videoUrl: string,
  progressCallback?: (progress: LessonCreationProgress) => void
): Promise<LessonCreationResult> {
  const progressHistory: LessonCreationProgress[] = [];

  const updateProgress = (
    step: LessonCreationProgress["step"],
    message: string,
    progress: number,
    error?: string
  ) => {
    const progressUpdate: LessonCreationProgress = {
      step,
      message,
      progress,
      error,
    };
    progressHistory.push(progressUpdate);
    progressCallback?.(progressUpdate);
  };

  try {
    // Step 1: Validate YouTube URL
    updateProgress("validating", "Validating YouTube URL...", 10);

    const videoInfo = parseYouTubeUrl(videoUrl);
    if (!videoInfo.isValid) {
      updateProgress(
        "error",
        "Invalid YouTube URL provided",
        0,
        "Please provide a valid YouTube video URL"
      );
      return {
        success: false,
        error: "Invalid YouTube URL provided",
        progress: progressHistory,
      };
    }

    const normalizedUrl = normalizeYouTubeUrl(videoUrl);
    console.log(`Creating lesson for video: ${videoInfo.videoId}`);

    console.log("videoInfo:", videoInfo);
    // Check if lesson already exists
    const existingLesson = await prisma.lesson.findFirst({
      where: { videoId: videoInfo.videoId },
    });

    if (existingLesson) {
      updateProgress(
        "error",
        "Lesson already exists for this video",
        0,
        "A lesson has already been created for this video"
      );
      return {
        success: false,
        error: "Lesson already exists for this video",
        progress: progressHistory,
      };
    }

    // Step 2: Extract transcript
    updateProgress("extracting", "Extracting video transcript...", 30);

    const transcriptResult = await extractTranscriptWithRetry(
      normalizedUrl,
      3,
      5000
    );
    if (!transcriptResult.success || !transcriptResult.transcript) {
      updateProgress(
        "error",
        "Failed to extract transcript",
        30,
        transcriptResult.error || "Could not extract transcript from video"
      );
      return {
        success: false,
        error: transcriptResult.error || "Failed to extract transcript",
        progress: progressHistory,
      };
    }

    updateProgress("extracting", "Transcript extracted successfully", 50);

    // Step 3: Generate lesson content with AI
    updateProgress("generating", "Generating lesson content with AI...", 60);

    const aiResult = await generateContentWithRetry(
      transcriptResult.transcript,
      `Lesson from ${videoInfo.videoId}`, // Will be updated with AI-generated title
      3
    );

    if (!aiResult.success || !aiResult.lesson) {
      updateProgress(
        "error",
        "Failed to generate lesson content",
        60,
        aiResult.error || "AI content generation failed"
      );
      return {
        success: false,
        error: aiResult.error || "Failed to generate lesson content",
        progress: progressHistory,
      };
    }

    updateProgress("generating", "Lesson content generated successfully", 80);

    // Step 4: Save to database
    updateProgress("saving", "Saving lesson to database...", 90);

    const savedLesson = await saveLessonToDatabase(
      aiResult.lesson,
      normalizedUrl,
      videoInfo.videoId
    );

    if (!savedLesson) {
      updateProgress(
        "error",
        "Failed to save lesson to database",
        90,
        "Database operation failed"
      );
      return {
        success: false,
        error: "Failed to save lesson to database",
        progress: progressHistory,
      };
    }

    // Step 5: Complete
    updateProgress("completed", "Lesson created successfully!", 100);

    console.log(`Lesson created successfully with ID: ${savedLesson.id}`);

    return {
      success: true,
      lesson: savedLesson,
      progress: progressHistory,
    };
  } catch (error) {
    console.error("Error in lesson creation workflow:", error);
    updateProgress(
      "error",
      "Unexpected error during lesson creation",
      0,
      error instanceof Error ? error.message : "Unknown error"
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unexpected error during lesson creation",
      progress: progressHistory,
    };
  }
}

/**
 * Save generated lesson content to database
 */
async function saveLessonToDatabase(
  generatedLesson: any,
  videoUrl: string,
  videoId: string
): Promise<Lesson | null> {
  try {
    const lesson = await prisma.lesson.create({
      data: {
        title: generatedLesson.title,
        videoUrl: videoUrl,
        videoId: videoId,
        sections: {
          create: generatedLesson.sections.map(
            (section: any, index: number) => ({
              title: section.title,
              summary: section.summary,
              content: section.content,
              learningObjectives: JSON.stringify(section.learningObjectives),
              order: index + 1,
              quiz: {
                create: {
                  questions: JSON.stringify(section.quiz.questions),
                },
              },
            })
          ),
        },
      },
      include: {
        sections: {
          orderBy: {
            order: "asc",
          },
          include: {
            quiz: true,
          },
        },
      },
    });

    // Transform the response to match our TypeScript interfaces
    const transformedLesson: Lesson = {
      ...lesson,
      sections: lesson.sections.map((section) => ({
        ...section,
        learningObjectives: JSON.parse(section.learningObjectives),
        quiz: section.quiz
          ? {
              ...section.quiz,
              questions: JSON.parse(section.quiz.questions),
            }
          : undefined,
      })),
    };

    return transformedLesson;
  } catch (error) {
    console.error("Error saving lesson to database:", error);
    return null;
  }
}

/**
 * Get lesson with progress information
 */
export async function getLessonWithProgress(
  lessonId: string,
  userId: string = "default"
): Promise<{ lesson: Lesson; progress?: any } | null> {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        sections: {
          orderBy: {
            order: "asc",
          },
          include: {
            quiz: true,
          },
        },
        progress: {
          where: { userId },
          include: {
            sectionProgress: true,
          },
        },
      },
    });

    if (!lesson) {
      return null;
    }

    // Transform the data
    const transformedLesson: Lesson = {
      ...lesson,
      sections: lesson.sections.map((section) => ({
        ...section,
        learningObjectives: JSON.parse(section.learningObjectives),
        quiz: section.quiz
          ? {
              ...section.quiz,
              questions: JSON.parse(section.quiz.questions),
            }
          : undefined,
      })),
    };

    return {
      lesson: transformedLesson,
      progress: lesson.progress[0] || null,
    };
  } catch (error) {
    console.error("Error fetching lesson with progress:", error);
    return null;
  }
}

/**
 * Get all lessons with progress information
 */
export async function getAllLessonsWithProgress(
  userId: string = "default"
): Promise<Array<{ lesson: Lesson; progress?: any }>> {
  try {
    const lessons = await prisma.lesson.findMany({
      include: {
        sections: {
          orderBy: {
            order: "asc",
          },
          include: {
            quiz: true,
          },
        },
        progress: {
          where: { userId },
          include: {
            sectionProgress: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return lessons.map((lesson) => ({
      lesson: {
        ...lesson,
        sections: lesson.sections.map((section) => ({
          ...section,
          learningObjectives: JSON.parse(section.learningObjectives),
          quiz: section.quiz
            ? {
                ...section.quiz,
                questions: JSON.parse(section.quiz.questions),
              }
            : undefined,
        })),
      },
      progress: lesson.progress[0] || null,
    }));
  } catch (error) {
    console.error("Error fetching lessons with progress:", error);
    return [];
  }
}

/**
 * Initialize progress tracking for a lesson
 */
export async function initializeLessonProgress(
  lessonId: string,
  userId: string = "default"
): Promise<boolean> {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        sections: true,
      },
    });

    if (!lesson) {
      return false;
    }

    // Check if progress already exists
    const existingProgress = await prisma.userProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
    });

    if (existingProgress) {
      return true; // Already initialized
    }

    // Create progress tracking
    await prisma.userProgress.create({
      data: {
        userId,
        lessonId,
        totalSections: lesson.sections.length,
        completedSections: 0,
      },
    });

    return true;
  } catch (error) {
    console.error("Error initializing lesson progress:", error);
    return false;
  }
}

/**
 * Delete a lesson and all associated data
 */
export async function deleteLesson(lessonId: string): Promise<boolean> {
  try {
    await prisma.lesson.delete({
      where: { id: lessonId },
    });
    return true;
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return false;
  }
}

/**
 * Validate lesson creation request
 */
export function validateLessonCreationRequest(request: CreateLessonRequest): {
  valid: boolean;
  error?: string;
} {
  if (!request.videoUrl) {
    return { valid: false, error: "Video URL is required" };
  }

  const videoInfo = parseYouTubeUrl(request.videoUrl);
  if (!videoInfo.isValid) {
    return { valid: false, error: "Invalid YouTube URL format" };
  }

  return { valid: true };
}

/**
 * Get lesson creation statistics
 */
export async function getLessonStats(): Promise<{
  totalLessons: number;
  totalSections: number;
  totalQuizzes: number;
  averageSectionsPerLesson: number;
}> {
  try {
    const [lessonCount, sectionCount, quizCount] = await Promise.all([
      prisma.lesson.count(),
      prisma.section.count(),
      prisma.quiz.count(),
    ]);

    return {
      totalLessons: lessonCount,
      totalSections: sectionCount,
      totalQuizzes: quizCount,
      averageSectionsPerLesson:
        lessonCount > 0
          ? Math.round((sectionCount / lessonCount) * 10) / 10
          : 0,
    };
  } catch (error) {
    console.error("Error fetching lesson stats:", error);
    return {
      totalLessons: 0,
      totalSections: 0,
      totalQuizzes: 0,
      averageSectionsPerLesson: 0,
    };
  }
}
