// AI Content Generation Service using Gemini AI

import { GoogleGenerativeAI } from '@google/generative-ai';

// Types for AI-generated content
export interface GeneratedSection {
  title: string;
  summary: string;
  learningObjectives: string[];
  content: string;
  quiz: {
    questions: QuizQuestion[];
  };
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface GeneratedLesson {
  title: string;
  sections: GeneratedSection[];
  totalSections: number;
}

export interface AIGenerationResponse {
  success: boolean;
  lesson?: GeneratedLesson;
  error?: string;
  tokensUsed?: number;
}

// Initialize Gemini AI client
let genAI: GoogleGenerativeAI | null = null;

function initializeGeminiAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/**
 * Generate lesson content from transcript using Gemini AI
 */
export async function generateLessonContent(
  transcript: string,
  videoTitle?: string,
  videoUrl?: string
): Promise<AIGenerationResponse> {
  try {
    console.log('Generating lesson content with AI...');
    
    // Check if we have a valid transcript
    if (!transcript || transcript.trim().length < 100) {
      return {
        success: false,
        error: 'Transcript is too short or empty for content generation'
      };
    }

    // Determine number of sections based on transcript length
    const sectionCount = determineSectionCount(transcript);
    console.log(`Planning ${sectionCount} sections for lesson`);

    // Generate content using Gemini AI
    const generatedContent = await generateWithGemini(transcript, sectionCount, videoTitle);
    
    if (!generatedContent) {
      return {
        success: false,
        error: 'Failed to generate content with AI'
      };
    }

    return {
      success: true,
      lesson: generatedContent
    };

  } catch (error) {
    console.error('Error generating lesson content:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      transcript: transcript.substring(0, 200) + '...',
      transcriptLength: transcript.length
    });
    
    // Fallback to mock content for development
    console.warn('Falling back to mock content generation');
    return generateMockContent(transcript, videoTitle);
  }
}

/**
 * Generate content using Gemini AI with structured prompts
 */
async function generateWithGemini(
  transcript: string,
  sectionCount: number,
  videoTitle?: string
): Promise<GeneratedLesson | null> {
  try {
    const genAI = initializeGeminiAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = buildLessonGenerationPrompt(transcript, sectionCount, videoTitle);
    console.log('Sending prompt to Gemini AI...');

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('Received response from Gemini AI');

    // Parse the JSON response
    const parsedContent = parseAIResponse(text);
    
    if (!parsedContent) {
      throw new Error('Failed to parse AI response');
    }

    return parsedContent;

  } catch (error) {
    console.error('Error with Gemini AI generation:', error);
    console.error('Gemini error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      apiKey: process.env.GEMINI_API_KEY ? 'Present' : 'Missing',
      promptLength: prompt.length
    });
    return null;
  }
}

/**
 * Build structured prompt for lesson generation
 */
function buildLessonGenerationPrompt(
  transcript: string,
  sectionCount: number,
  videoTitle?: string
): string {
  return `You are an expert educational content creator. Your task is to analyze a video transcript and create a structured, beginner-friendly learning course.

**Instructions:**
1. Create exactly ${sectionCount} logical sections from the transcript
2. Each section should be coherent and build upon previous sections
3. Use a conversational, beginner-friendly tone
4. Generate 5 multiple-choice questions per section
5. Provide clear explanations for correct answers

**Input:**
Video Title: ${videoTitle || 'Educational Video'}
Transcript: ${transcript}

**Required Output Format (JSON):**
{
  "title": "Generated lesson title based on content",
  "sections": [
    {
      "title": "Section title",
      "summary": "Brief summary of what this section covers",
      "learningObjectives": [
        "Specific learning objective 1",
        "Specific learning objective 2",
        "Specific learning objective 3"
      ],
      "content": "Detailed, conversational lesson content in markdown format. Use headers, bullet points, and examples. Make it engaging and easy to understand for beginners.",
      "quiz": {
        "questions": [
          {
            "question": "Clear, specific question about the content",
            "options": [
              "Option A",
              "Option B", 
              "Option C",
              "Option D"
            ],
            "correctAnswer": 0,
            "explanation": "Clear explanation of why this answer is correct"
          }
        ]
      }
    }
  ]
}

**Important Guidelines:**
- Make content beginner-friendly and conversational
- Use real examples from the transcript
- Ensure questions are answerable from the lesson content
- Keep explanations clear and educational
- Structure content logically with proper flow between sections

Generate the lesson now:`;
}

/**
 * Parse AI response and validate structure
 */
function parseAIResponse(response: string): GeneratedLesson | null {
  try {
    // Clean the response - remove markdown code blocks if present
    let cleanResponse = response.trim();
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleanResponse);
    
    // Validate the structure
    if (!parsed.title || !parsed.sections || !Array.isArray(parsed.sections)) {
      throw new Error('Invalid lesson structure');
    }

    // Validate each section
    for (const section of parsed.sections) {
      if (!section.title || !section.summary || !section.content || 
          !section.learningObjectives || !Array.isArray(section.learningObjectives) ||
          !section.quiz || !section.quiz.questions || !Array.isArray(section.quiz.questions)) {
        throw new Error('Invalid section structure');
      }

      // Validate quiz questions
      for (const question of section.quiz.questions) {
        if (!question.question || !question.options || !Array.isArray(question.options) ||
            question.options.length !== 4 || typeof question.correctAnswer !== 'number' ||
            question.correctAnswer < 0 || question.correctAnswer >= 4 || !question.explanation) {
          throw new Error('Invalid quiz question structure');
        }
      }
    }

    return {
      title: parsed.title,
      sections: parsed.sections,
      totalSections: parsed.sections.length
    };

  } catch (error) {
    console.error('Error parsing AI response:', error);
    console.log('Raw response:', response);
    return null;
  }
}

/**
 * Determine optimal number of sections based on transcript length
 */
export function determineSectionCount(transcript: string): number {
  const wordCount = transcript.split(/\s+/).length;
  
  if (wordCount < 500) {
    return 2; // Short content: 1-2 sections
  } else if (wordCount < 1500) {
    return 3; // Medium content: 3 sections
  } else if (wordCount < 3000) {
    return 4; // Long content: 4 sections
  } else {
    return 5; // Very long content: 5 sections
  }
}

/**
 * Validate generated content quality
 */
export function validateGeneratedContent(lesson: GeneratedLesson): boolean {
  try {
    // Check basic structure
    if (!lesson.title || !lesson.sections || lesson.sections.length === 0) {
      return false;
    }

    // Check each section
    for (const section of lesson.sections) {
      // Validate section structure
      if (!section.title || !section.summary || !section.content ||
          !section.learningObjectives || section.learningObjectives.length === 0) {
        return false;
      }

      // Validate content length
      if (section.content.length < 200) {
        return false;
      }

      // Validate quiz
      if (!section.quiz || !section.quiz.questions || section.quiz.questions.length !== 5) {
        return false;
      }

      // Validate each question
      for (const question of section.quiz.questions) {
        if (!question.question || !question.options || question.options.length !== 4 ||
            typeof question.correctAnswer !== 'number' || !question.explanation) {
          return false;
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error validating generated content:', error);
    return false;
  }
}

/**
 * Generate mock content for development and fallback
 */
function generateMockContent(transcript: string, videoTitle?: string): AIGenerationResponse {
  const sectionCount = determineSectionCount(transcript);
  
  const mockLesson: GeneratedLesson = {
    title: videoTitle || 'Introduction to Programming Concepts',
    totalSections: sectionCount,
    sections: Array.from({ length: sectionCount }, (_, index) => ({
      title: `Section ${index + 1}: Core Concepts`,
      summary: `This section covers fundamental programming concepts and practical applications.`,
      learningObjectives: [
        'Understand basic programming principles',
        'Learn practical implementation techniques',
        'Apply concepts to real-world scenarios'
      ],
      content: `# Programming Fundamentals

Welcome to this section on programming fundamentals! In this part of our lesson, we'll explore the core concepts that every programmer needs to understand.

## What You'll Learn

Programming is like learning a new language - it has its own vocabulary, grammar, and structure. Just as you wouldn't expect to become fluent in French overnight, becoming proficient in programming takes time and practice.

## Key Concepts

Here are the main ideas we'll cover:

- **Variables**: Think of these as containers that hold information
- **Functions**: Reusable blocks of code that perform specific tasks
- **Logic**: The decision-making process in your programs

## Practical Examples

Let's look at a simple example. Imagine you're creating a calculator. You'd need:

1. Variables to store the numbers
2. Functions to perform calculations
3. Logic to handle different operations

This approach makes your code organized, readable, and maintainable.

## Why This Matters

Understanding these fundamentals will help you tackle more complex programming challenges with confidence. Every advanced concept builds on these basics.`,
      quiz: {
        questions: [
          {
            question: 'What is the primary purpose of variables in programming?',
            options: [
              'To store and manage data',
              'To make code look complex',
              'To slow down programs',
              'To replace functions'
            ],
            correctAnswer: 0,
            explanation: 'Variables are containers that store data values, making it easy to manage and manipulate information throughout your program.'
          },
          {
            question: 'Which analogy best describes learning programming?',
            options: [
              'Like riding a bicycle',
              'Like learning a new language',
              'Like solving a math problem',
              'Like playing a video game'
            ],
            correctAnswer: 1,
            explanation: 'Programming is like learning a new language because it has its own vocabulary, grammar, and structure that takes time to master.'
          },
          {
            question: 'What makes code maintainable?',
            options: [
              'Using complex algorithms',
              'Writing longer functions',
              'Organization and readability',
              'Adding more variables'
            ],
            correctAnswer: 2,
            explanation: 'Well-organized and readable code is easier to understand, debug, and modify, making it more maintainable over time.'
          },
          {
            question: 'Functions in programming are best described as:',
            options: [
              'Decorative elements',
              'Reusable blocks of code',
              'Error messages',
              'Variable containers'
            ],
            correctAnswer: 1,
            explanation: 'Functions are reusable blocks of code that perform specific tasks, helping to organize code and avoid repetition.'
          },
          {
            question: 'Why are programming fundamentals important?',
            options: [
              'They are required by law',
              'They make programs run faster',
              'They provide foundation for advanced concepts',
              'They are the only concepts you need'
            ],
            correctAnswer: 2,
            explanation: 'Programming fundamentals provide the foundation that all advanced concepts build upon, making them essential for long-term success.'
          }
        ]
      }
    }))
  };

  return {
    success: true,
    lesson: mockLesson
  };
}

/**
 * Retry content generation with different parameters
 */
export async function generateContentWithRetry(
  transcript: string,
  videoTitle?: string,
  maxRetries: number = 2
): Promise<AIGenerationResponse> {
  let lastError: string = '';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Content generation attempt ${attempt}/${maxRetries}`);
    
    const result = await generateLessonContent(transcript, videoTitle);
    
    if (result.success && result.lesson && validateGeneratedContent(result.lesson)) {
      return result;
    }

    lastError = result.error || 'Generated content failed validation';
    
    if (attempt < maxRetries) {
      console.log(`Attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // If all attempts failed, return mock content
  console.warn('All generation attempts failed, using mock content');
  return generateMockContent(transcript, videoTitle);
}
