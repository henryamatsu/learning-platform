import { NextRequest, NextResponse } from 'next/server';
import { 
  generateContentWithRetry, 
  validateGeneratedContent, 
  determineSectionCount,
  GeneratedLesson 
} from '@/lib/services/aiService';
import { 
  buildPrompt, 
  validatePromptVariables, 
  LESSON_GENERATION_PROMPT,
  selectPromptTemplate 
} from '@/lib/prompts/lessonPrompts';

// GET /api/test-ai - Comprehensive test of AI content generation
export async function GET(request: NextRequest) {
  const testResults: any[] = [];
  let allTestsPassed = true;

  try {
    console.log('🧪 Starting AI content generation tests...');

    // Test 1: Section count determination
    console.log('🧪 Testing section count determination...');
    const shortTranscript = 'This is a short transcript with minimal content for testing purposes.';
    const mediumTranscript = 'This is a medium-length transcript. '.repeat(50);
    const longTranscript = 'This is a long transcript with extensive content. '.repeat(200);

    const shortSections = determineSectionCount(shortTranscript);
    const mediumSections = determineSectionCount(mediumTranscript);
    const longSections = determineSectionCount(longTranscript);

    const sectionTestPassed = 
      shortSections >= 2 && shortSections <= 3 &&
      mediumSections >= 3 && mediumSections <= 4 &&
      longSections >= 4 && longSections <= 5;

    testResults.push({
      test: 'Section Count Determination',
      passed: sectionTestPassed,
      details: {
        short: { wordCount: shortTranscript.split(/\s+/).length, sections: shortSections },
        medium: { wordCount: mediumTranscript.split(/\s+/).length, sections: mediumSections },
        long: { wordCount: longTranscript.split(/\s+/).length, sections: longSections }
      }
    });

    if (!sectionTestPassed) allTestsPassed = false;

    // Test 2: Prompt template validation
    console.log('🧪 Testing prompt template system...');
    const templateVariables = {
      transcript: 'Sample transcript content',
      videoTitle: 'Test Video',
      sectionCount: 3
    };

    const validation = validatePromptVariables(LESSON_GENERATION_PROMPT, templateVariables);
    const builtPrompt = buildPrompt(LESSON_GENERATION_PROMPT, templateVariables);

    const promptTestPassed = 
      validation.valid &&
      builtPrompt.system.length > 0 &&
      builtPrompt.user.length > 0 &&
      builtPrompt.user.includes('Sample transcript content');

    testResults.push({
      test: 'Prompt Template System',
      passed: promptTestPassed,
      details: {
        validation,
        promptLength: builtPrompt.user.length,
        containsVariables: builtPrompt.user.includes('Sample transcript content')
      }
    });

    if (!promptTestPassed) allTestsPassed = false;

    // Test 3: Template selection
    console.log('🧪 Testing template selection...');
    const lessonTemplate = selectPromptTemplate('lesson');
    const quizTemplate = selectPromptTemplate('quiz');
    const refinementTemplate = selectPromptTemplate('refinement');

    const templateSelectionPassed = 
      lessonTemplate === LESSON_GENERATION_PROMPT &&
      quizTemplate !== lessonTemplate &&
      refinementTemplate !== lessonTemplate;

    testResults.push({
      test: 'Template Selection',
      passed: templateSelectionPassed,
      details: {
        lessonTemplateSelected: lessonTemplate === LESSON_GENERATION_PROMPT,
        templatesAreDifferent: quizTemplate !== lessonTemplate
      }
    });

    if (!templateSelectionPassed) allTestsPassed = false;

    // Test 4: Content generation (with fallback to mock)
    console.log('🧪 Testing content generation...');
    const testTranscript = `JavaScript variables are fundamental building blocks of programming. 

In this comprehensive lesson, we'll explore the three main ways to declare variables in JavaScript: var, let, and const.

The var keyword has been around since the beginning of JavaScript. It has function scope, meaning the variable is accessible throughout the entire function where it's declared.

The let keyword was introduced in ES6 (ECMAScript 2015). It provides block scope, which means the variable is only accessible within the block of code where it's declared.

The const keyword is also from ES6 and is used to declare constants. Once a value is assigned to a const variable, it cannot be reassigned.

Understanding scope is crucial for writing effective JavaScript code. Scope determines where in your code a variable can be accessed and modified.

Best practices include using const by default, let when you need to reassign, and avoiding var in modern JavaScript development.

Variable naming conventions are important for code readability. Use descriptive names, follow camelCase, and avoid reserved keywords.

These concepts form the foundation for more advanced JavaScript programming techniques.`;

    try {
      const generationResult = await generateContentWithRetry(
        testTranscript,
        'JavaScript Variables Masterclass',
        2 // max retries for testing
      );

      const contentValid = generationResult.success && 
                          generationResult.lesson &&
                          validateGeneratedContent(generationResult.lesson);

      testResults.push({
        test: 'Content Generation',
        passed: contentValid,
        details: {
          success: generationResult.success,
          hasLesson: !!generationResult.lesson,
          sectionCount: generationResult.lesson?.sections.length || 0,
          validationPassed: contentValid,
          lessonTitle: generationResult.lesson?.title,
          error: generationResult.error
        }
      });

      if (!contentValid) allTestsPassed = false;

      // Test 5: Content validation (if generation succeeded)
      if (generationResult.lesson) {
        console.log('🧪 Testing content validation...');
        
        const lesson = generationResult.lesson;
        const validationTests = {
          hasTitle: !!lesson.title,
          hasSections: lesson.sections && lesson.sections.length > 0,
          sectionsHaveContent: lesson.sections.every((s: any) => 
            s.title && s.summary && s.content && s.learningObjectives && s.quiz
          ),
          quizzesValid: lesson.sections.every((s: any) => 
            s.quiz.questions && s.quiz.questions.length === 5
          ),
          questionsValid: lesson.sections.every((s: any) =>
            s.quiz.questions.every((q: any) => 
              q.question && q.options && q.options.length === 4 && 
              typeof q.correctAnswer === 'number' && q.explanation
            )
          )
        };

        const validationPassed = Object.values(validationTests).every(test => test === true);

        testResults.push({
          test: 'Content Validation',
          passed: validationPassed,
          details: validationTests
        });

        if (!validationPassed) allTestsPassed = false;
      }

    } catch (error) {
      testResults.push({
        test: 'Content Generation',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      allTestsPassed = false;
    }

    // Test 6: Error handling
    console.log('🧪 Testing error handling...');
    try {
      const emptyResult = await generateContentWithRetry('', 'Empty Test');
      const shortResult = await generateContentWithRetry('Too short', 'Short Test');

      const errorHandlingPassed = 
        (!emptyResult.success || emptyResult.lesson) && // Should fail gracefully or provide fallback
        (!shortResult.success || shortResult.lesson);   // Should fail gracefully or provide fallback

      testResults.push({
        test: 'Error Handling',
        passed: errorHandlingPassed,
        details: {
          emptyTranscriptHandled: !emptyResult.success || !!emptyResult.lesson,
          shortTranscriptHandled: !shortResult.success || !!shortResult.lesson,
          emptyResult: { success: emptyResult.success, hasLesson: !!emptyResult.lesson },
          shortResult: { success: shortResult.success, hasLesson: !!shortResult.lesson }
        }
      });

      if (!errorHandlingPassed) allTestsPassed = false;
    } catch (error) {
      // Error handling should not throw, but if it does, that's a test failure
      testResults.push({
        test: 'Error Handling',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      allTestsPassed = false;
    }

    // Summary
    const passedTests = testResults.filter(r => r.passed).length;
    const totalTests = testResults.length;

    return NextResponse.json({
      success: allTestsPassed,
      message: `AI content generation tests completed: ${passedTests}/${totalTests} passed`,
      summary: {
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        allTestsPassed
      },
      tests: testResults,
      timestamp: new Date().toISOString(),
      environment: {
        hasGeminiKey: !!process.env.GEMINI_API_KEY,
        nodeEnv: process.env.NODE_ENV
      }
    });

  } catch (error) {
    console.error('❌ AI content generation test failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'AI content generation test suite failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        tests: testResults
      },
      { status: 500 }
    );
  }
}
