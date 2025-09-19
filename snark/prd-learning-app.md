# Product Requirements Document: AI-Powered Learning App

## Introduction/Overview

The AI-Powered Learning App is a beginner-friendly educational platform that transforms YouTube videos into structured, interactive learning experiences. Users simply submit a YouTube video link, and the app automatically generates comprehensive course material using AI-powered transcript analysis. The app creates conversational lessons with summaries, learning objectives, detailed content, and interactive quizzes to enhance learning retention.

**Problem Statement:** Many learners struggle to extract structured knowledge from video content, often watching passively without clear learning objectives or assessment of understanding.

**Solution:** An intelligent system that converts any educational YouTube video into a structured learning course with clear objectives, digestible content sections, and immediate feedback through quizzes.

## Goals

1. **Simplify Learning:** Transform passive video watching into active, structured learning experiences
2. **Accessibility:** Make educational content more accessible through text-based lessons and clear structure
3. **Engagement:** Increase learning retention through interactive quizzes and progress tracking
4. **Efficiency:** Automatically generate course material to save educators and learners time
5. **Personalization:** Adapt content length and complexity based on video duration and content

## User Stories

### Primary User Stories

- **As a student**, I want to submit a YouTube video link so that I can get a structured learning course from the content
- **As a learner**, I want to see clear learning objectives for each section so that I know what I'll accomplish
- **As a user**, I want to take quizzes after each section so that I can test my understanding
- **As a student**, I want to track my progress through multi-section courses so that I can see my completion status
- **As a learner**, I want immediate feedback on quiz answers so that I can learn from my mistakes

### Secondary User Stories

- **As a user**, I want to view all my created lessons in one place so that I can easily access my learning materials
- **As a learner**, I want conversational, beginner-friendly content so that complex topics are easy to understand
- **As a student**, I want to see the original video alongside the lesson material so that I can reference both formats

## Functional Requirements

### Core Features

1. **Video Submission & Processing**

   - The system must allow users to submit YouTube video links through a simple form
   - The system must validate YouTube URLs and provide error messages for invalid links
   - The system must extract video transcripts using the Supadata transcript tool
   - The system must handle videos of varying lengths (5 minutes to 2+ hours)

2. **AI-Powered Content Generation**

   - The system must use Gemini AI to analyze video transcripts and generate structured lessons
   - The system must intelligently split content into 1-2 sections for short videos (<30 minutes) and 3-5 sections for longer videos
   - The system must generate learning objectives for each section
   - The system must create high-level summaries for each section
   - The system must produce detailed, conversational lesson material for each section
   - The system must generate 5 multiple-choice questions per section with 4 answer options each

3. **Lesson Structure & Display**

   - The system must display lessons with embedded YouTube videos
   - The system must show learning objectives prominently at the beginning of each section
   - The system must present lesson content in a readable, conversational format
   - The system must organize content into clear sections with navigation between them

4. **Interactive Quizzes**

   - The system must present multiple-choice quizzes at the end of each section
   - The system must provide immediate feedback after quiz submission
   - The system must reveal correct answers for any incorrect responses
   - The system must allow users to retake quizzes
   - The system must track quiz completion status

5. **Progress Tracking**

   - The system must track user progress through multi-section lessons
   - The system must display completion percentage for each lesson
   - The system must show which sections have been completed
   - The system must persist progress data across browser sessions

6. **Data Management**
   - The system must store lesson data in SQLite database using Prisma ORM
   - The system must save user progress and quiz results
   - The system must handle concurrent users and data integrity

### User Interface Requirements

7. **Navigation & Layout**

   - The system must provide a fixed top navigation bar with app branding
   - The system must include a collapsible left sidebar for navigation
   - The system must highlight the current page in navigation elements
   - The system must be responsive for desktop and mobile devices

8. **Page Structure**

   - The system must provide a "Current Lessons" page displaying all user lessons
   - The system must provide a "Create Lesson" page for video submission
   - The system must provide "Lesson Details" pages for viewing lesson content
   - The system must use card-based layouts for lesson listings

9. **Component Library**
   - The system must include reusable button components (primary, secondary styles)
   - The system must include form components for inputs and submissions
   - The system must include card components for lesson display
   - The system must include quiz components for questions and feedback

## Non-Goals (Out of Scope)

- **User Authentication:** Initial version will not include user accounts or login functionality
- **Video Hosting:** The app will not host videos, only link to YouTube content
- **Advanced Analytics:** Detailed learning analytics and reporting are not included
- **Social Features:** Sharing, comments, or collaborative features are not included
- **Mobile App:** Only web application, no native mobile apps
- **Multiple Video Sources:** Only YouTube videos, no other platforms initially
- **Custom Quiz Creation:** Users cannot manually create or edit quizzes
- **Video Editing:** No video manipulation or editing capabilities
- **Offline Access:** All functionality requires internet connection

## Design Considerations

### UI/UX Requirements

- **Clean, Minimalist Design:** Simple layout focusing on content readability
- **Beginner-Friendly Interface:** Clear navigation and intuitive user flows
- **Responsive Design:** Optimized for desktop and mobile viewing
- **Accessibility:** High contrast, readable fonts, keyboard navigation support
- **Loading States:** Clear feedback during transcript processing and lesson generation

### Visual Design

- **Color Scheme:** Professional yet approachable colors suitable for educational content
- **Typography:** Clear, readable fonts optimized for long-form content
- **Layout:** Card-based design for lessons, clean forms for input, organized quiz layouts
- **Icons:** Simple, recognizable icons for navigation and actions

## Technical Considerations

### Technology Stack

- **Frontend:** Next.js 14 with TypeScript
- **Styling:** Vanilla CSS in separate files (no Tailwind for components)
- **Database:** SQLite with Prisma ORM
- **AI Integration:** Gemini AI for content generation
- **Transcript Service:** Supadata MCP tool for YouTube transcript extraction

### Data Structure

```json
{
  "lesson": {
    "id": "string",
    "title": "string",
    "videoUrl": "string",
    "videoId": "string",
    "createdAt": "datetime",
    "sections": [
      {
        "id": "string",
        "title": "string",
        "summary": "string",
        "learningObjectives": ["string"],
        "content": "string",
        "quiz": {
          "questions": [
            {
              "question": "string",
              "options": ["string"],
              "correctAnswer": "number",
              "explanation": "string"
            }
          ]
        }
      }
    ]
  }
}
```

### Integration Requirements

- **Supadata MCP Integration:** Seamless transcript extraction from YouTube URLs
- **Gemini AI Integration:** Structured JSON input/output for lesson generation
- **Database Schema:** Efficient storage and retrieval of lesson and progress data

## Success Metrics

### User Engagement

- **Lesson Completion Rate:** >70% of started lessons should be completed
- **Quiz Participation:** >80% of users should attempt quizzes
- **Return Usage:** Users should create multiple lessons over time

### Technical Performance

- **Lesson Generation Time:** <2 minutes for average-length videos (10-30 minutes)
- **Page Load Speed:** <3 seconds for lesson pages
- **Uptime:** >99% availability

### Content Quality

- **Quiz Accuracy:** Generated questions should be relevant and answerable from content
- **Content Coherence:** Lesson sections should flow logically and cover key points
- **User Satisfaction:** Positive feedback on lesson quality and usefulness

## User Flow

### Primary User Journey: Creating and Completing a Lesson

1. **Landing/Current Lessons Page**

   - User sees overview of existing lessons (empty initially)
   - User clicks "Create New Lesson" button

2. **Create Lesson Page**

   - User pastes YouTube video URL into input field
   - User clicks "Generate Lesson" button
   - System validates URL and shows loading state
   - System extracts transcript using Supadata tool
   - System processes transcript with Gemini AI
   - System generates structured lesson content
   - User is redirected to new lesson page

3. **Lesson Details Page**

   - User sees lesson title and embedded video
   - User views first section with learning objectives
   - User reads through lesson content
   - User takes quiz at end of section
   - User receives immediate feedback on answers
   - User proceeds to next section (if available)
   - System tracks progress throughout

4. **Lesson Completion**
   - User completes all sections and quizzes
   - System shows completion status
   - User can review any section or retake quizzes
   - Lesson appears as "completed" in Current Lessons page

## Sample Lesson Structure

### Example: "Introduction to JavaScript Variables" (15-minute video)

**Section 1: Variable Basics**

- **Learning Objectives:**

  - Understand what variables are in programming
  - Learn the difference between var, let, and const
  - Practice declaring variables with different keywords

- **Summary:** This section covers the fundamental concept of variables in JavaScript, including the three ways to declare them and when to use each approach.

- **Content:** Variables are like containers that store data values in your JavaScript programs. Think of them as labeled boxes where you can put different types of information... [conversational explanation continues]

- **Quiz Questions:**
  1. Which keyword should you use to declare a variable that won't change?
     - a) var
     - b) let
     - c) const ✓
     - d) variable
  2. What happens when you try to reassign a const variable?
     - a) It works normally
     - b) It creates a new variable
     - c) It throws an error ✓
     - d) It converts to let

**Section 2: Variable Scope and Best Practices**

- **Learning Objectives:**

  - Understand function scope vs block scope
  - Learn best practices for naming variables
  - Recognize common variable-related errors

- [Similar structure continues...]

## Open Questions

1. **Content Moderation:** How should the system handle inappropriate or non-educational video content?
2. **Video Length Limits:** Should there be maximum video length restrictions for processing efficiency?
3. **Language Support:** Should the initial version support non-English videos?
4. **Error Handling:** What should happen if transcript extraction fails or AI generation produces poor results?
5. **Storage Limits:** How many lessons should users be able to create before storage becomes a concern?
6. **Performance Optimization:** Should lesson generation happen asynchronously with email notifications?

---

_This PRD serves as the foundation for developing the AI-Powered Learning App. It should be reviewed and updated as development progresses and user feedback is gathered._
