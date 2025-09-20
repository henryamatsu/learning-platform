// Data validation utilities for API endpoints

import { z } from 'zod';

// YouTube URL validation schema
export const youtubeUrlSchema = z.string()
  .min(1, 'YouTube URL is required')
  .refine((url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+(&[\w=]*)?$/;
    return youtubeRegex.test(url);
  }, 'Please provide a valid YouTube video URL');

// Lesson creation request validation
export const createLessonSchema = z.object({
  videoUrl: youtubeUrlSchema,
});

// Progress update validation
export const updateProgressSchema = z.object({
  lessonId: z.string().min(1, 'Lesson ID is required'),
  sectionId: z.string().min(1, 'Section ID is required'),
  userId: z.string().optional(),
  completed: z.boolean().optional(),
  score: z.number().min(0).max(100).optional(),
});

// Quiz submission validation
export const quizSubmissionSchema = z.object({
  quizId: z.string().min(1, 'Quiz ID is required'),
  answers: z.array(z.number().min(0)).min(1, 'At least one answer is required'),
  userId: z.string().optional(),
});

// Generic ID validation
export const idSchema = z.string().min(1, 'ID is required');

// Pagination validation
export const paginationSchema = z.object({
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(10),
});

/**
 * Validate request data against a schema
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      
      throw new Error(`Validation error: ${errorMessage}`);
    }
    throw error;
  }
}

/**
 * Safe validation that returns result with success flag
 */
export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  error?: string;
} {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Validation failed' };
  }
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

/**
 * Validate and sanitize lesson title
 */
export function validateLessonTitle(title: string): string {
  const sanitized = sanitizeString(title);
  if (sanitized.length < 3) {
    throw new Error('Lesson title must be at least 3 characters long');
  }
  if (sanitized.length > 200) {
    throw new Error('Lesson title must be less than 200 characters');
  }
  return sanitized;
}

/**
 * Validate lesson content
 */
export function validateLessonContent(content: string): string {
  const sanitized = sanitizeString(content);
  if (sanitized.length < 50) {
    throw new Error('Lesson content must be at least 50 characters long');
  }
  if (sanitized.length > 50000) {
    throw new Error('Lesson content must be less than 50,000 characters');
  }
  return sanitized;
}

/**
 * Validate quiz questions
 */
export function validateQuizQuestions(questions: any[]): boolean {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('Quiz must have at least one question');
  }

  if (questions.length > 20) {
    throw new Error('Quiz cannot have more than 20 questions');
  }

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    
    if (!question.question || typeof question.question !== 'string') {
      throw new Error(`Question ${i + 1}: Question text is required`);
    }

    if (!Array.isArray(question.options) || question.options.length !== 4) {
      throw new Error(`Question ${i + 1}: Must have exactly 4 options`);
    }

    if (typeof question.correctAnswer !== 'number' || 
        question.correctAnswer < 0 || 
        question.correctAnswer >= 4) {
      throw new Error(`Question ${i + 1}: Correct answer must be between 0 and 3`);
    }

    if (question.explanation && typeof question.explanation !== 'string') {
      throw new Error(`Question ${i + 1}: Explanation must be a string`);
    }
  }

  return true;
}
