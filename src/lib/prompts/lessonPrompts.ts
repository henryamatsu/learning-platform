// Prompt templates for AI lesson generation

export interface PromptTemplate {
  system: string;
  user: string;
}

/**
 * Main lesson generation prompt template
 */
export const LESSON_GENERATION_PROMPT: PromptTemplate = {
  system: `You are an expert educational content creator and instructional designer. Your specialty is transforming video transcripts into engaging, structured learning experiences for beginners.

Key principles:
- Use conversational, beginner-friendly language
- Break complex concepts into digestible chunks
- Provide practical examples and analogies
- Create engaging, relevant quiz questions
- Ensure logical flow between sections
- Focus on practical application and understanding`,

  user: `Create a structured learning course from this video transcript. Follow these requirements exactly:

**Content Requirements:**
- Generate exactly {sectionCount} logical sections
- Each section should build upon previous sections
- Use conversational, beginner-friendly tone
- Include practical examples and analogies
- Create exactly 5 multiple-choice questions per section
- Provide clear explanations for correct answers

**Input Data:**
Video Title: {videoTitle}
Target Sections: {sectionCount}
Transcript: {transcript}

**Output Format (JSON only, no markdown):**
{
  "title": "Engaging lesson title that captures the main topic",
  "sections": [
    {
      "title": "Clear, descriptive section title",
      "summary": "2-3 sentence summary of what this section covers",
      "learningObjectives": [
        "Specific, measurable learning objective 1",
        "Specific, measurable learning objective 2", 
        "Specific, measurable learning objective 3"
      ],
      "content": "Detailed lesson content in markdown format. Use headers (##, ###), bullet points, code examples if relevant, and analogies. Make it conversational and engaging. Minimum 300 words.",
      "quiz": {
        "questions": [
          {
            "question": "Clear, specific question testing understanding",
            "options": [
              "Plausible but incorrect option",
              "Correct answer",
              "Plausible but incorrect option", 
              "Plausible but incorrect option"
            ],
            "correctAnswer": 1,
            "explanation": "Clear explanation of why this answer is correct and why others are wrong"
          }
        ]
      }
    }
  ]
}

Generate the complete lesson now:`
};

/**
 * Quiz generation focused prompt
 */
export const QUIZ_GENERATION_PROMPT: PromptTemplate = {
  system: `You are an expert quiz creator specializing in educational assessments. Create engaging, fair, and educational multiple-choice questions that test understanding rather than memorization.`,

  user: `Create 5 multiple-choice questions for this lesson content:

**Content:** {content}

**Requirements:**
- Questions should test understanding, not just memorization
- All options should be plausible to someone who didn't study
- Explanations should be educational and clear
- Avoid trick questions or overly complex wording
- Focus on practical application when possible

**Format (JSON only):**
{
  "questions": [
    {
      "question": "Clear, specific question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Educational explanation"
    }
  ]
}

Generate the quiz now:`
};

/**
 * Content refinement prompt for improving generated content
 */
export const CONTENT_REFINEMENT_PROMPT: PromptTemplate = {
  system: `You are an educational content editor. Your job is to improve lesson content to make it more engaging, clear, and beginner-friendly.`,

  user: `Improve this lesson content while maintaining its structure:

**Original Content:** {content}

**Improvement Goals:**
- Make language more conversational and beginner-friendly
- Add practical examples and analogies
- Improve flow and readability
- Ensure concepts build logically
- Add engaging elements without changing core information

**Format:** Return the improved content in the same markdown format.

Improve the content now:`
};

/**
 * Section splitting prompt for long transcripts
 */
export const SECTION_SPLITTING_PROMPT: PromptTemplate = {
  system: `You are an expert at analyzing educational content and identifying natural break points for learning sections.`,

  user: `Analyze this transcript and identify {sectionCount} logical sections:

**Transcript:** {transcript}

**Requirements:**
- Each section should cover a coherent topic
- Sections should build upon each other logically
- Aim for roughly equal section lengths
- Identify natural transition points
- Consider cognitive load and learning progression

**Format (JSON only):**
{
  "sections": [
    {
      "title": "Section title",
      "startMarker": "First few words where this section begins...",
      "endMarker": "Last few words where this section ends...",
      "mainTopics": ["Topic 1", "Topic 2", "Topic 3"],
      "rationale": "Why this makes a good section boundary"
    }
  ]
}

Analyze and split the content now:`
};

/**
 * Learning objectives generation prompt
 */
export const LEARNING_OBJECTIVES_PROMPT: PromptTemplate = {
  system: `You are an instructional designer expert at writing clear, measurable learning objectives using Bloom's taxonomy.`,

  user: `Create 3-4 specific learning objectives for this content:

**Content:** {content}

**Requirements:**
- Use action verbs (understand, explain, apply, analyze, etc.)
- Make objectives specific and measurable
- Focus on what learners will be able to DO after the lesson
- Align with beginner skill level
- Cover different cognitive levels when appropriate

**Format (JSON only):**
{
  "learningObjectives": [
    "Specific, measurable objective 1",
    "Specific, measurable objective 2",
    "Specific, measurable objective 3"
  ]
}

Generate the objectives now:`
};

/**
 * Build prompt with template substitution
 */
export function buildPrompt(
  template: PromptTemplate,
  variables: Record<string, string | number>
): { system: string; user: string } {
  let systemPrompt = template.system;
  let userPrompt = template.user;

  // Replace variables in both system and user prompts
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    systemPrompt = systemPrompt.replace(new RegExp(placeholder, 'g'), String(value));
    userPrompt = userPrompt.replace(new RegExp(placeholder, 'g'), String(value));
  });

  return {
    system: systemPrompt,
    user: userPrompt
  };
}

/**
 * Validate prompt variables
 */
export function validatePromptVariables(
  template: PromptTemplate,
  variables: Record<string, any>
): { valid: boolean; missing: string[] } {
  const requiredVars: string[] = [];
  
  // Extract required variables from template
  const systemMatches = template.system.match(/\{(\w+)\}/g) || [];
  const userMatches = template.user.match(/\{(\w+)\}/g) || [];
  
  [...systemMatches, ...userMatches].forEach(match => {
    const varName = match.slice(1, -1); // Remove { and }
    if (!requiredVars.includes(varName)) {
      requiredVars.push(varName);
    }
  });

  // Check which variables are missing
  const missing = requiredVars.filter(varName => !(varName in variables));

  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Get appropriate prompt template based on content type and requirements
 */
export function selectPromptTemplate(
  contentType: 'lesson' | 'quiz' | 'refinement' | 'splitting' | 'objectives',
  options?: {
    complexity?: 'beginner' | 'intermediate' | 'advanced';
    focus?: 'practical' | 'theoretical' | 'mixed';
  }
): PromptTemplate {
  switch (contentType) {
    case 'lesson':
      return LESSON_GENERATION_PROMPT;
    case 'quiz':
      return QUIZ_GENERATION_PROMPT;
    case 'refinement':
      return CONTENT_REFINEMENT_PROMPT;
    case 'splitting':
      return SECTION_SPLITTING_PROMPT;
    case 'objectives':
      return LEARNING_OBJECTIVES_PROMPT;
    default:
      return LESSON_GENERATION_PROMPT;
  }
}
