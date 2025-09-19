"use client";

import { Button } from "../../../components/ui/Button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "../../../components/ui/Card";
import { Quiz } from "../../../components/quiz/Quiz";

// Mock data for demonstration
const mockLesson = {
  id: "1",
  title: "Introduction to JavaScript Variables",
  videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  videoId: "dQw4w9WgXcQ",
  createdAt: new Date("2024-01-15"),
  sections: [
    {
      id: "section-1",
      title: "What are Variables?",
      summary:
        "Learn the fundamental concept of variables in programming and why they are essential for storing and manipulating data.",
      learningObjectives: [
        "Understand what variables are and their purpose",
        "Learn the difference between declaring and initializing variables",
        "Recognize when to use variables in your code",
      ],
      content: `
Variables are like containers that store data values in your JavaScript programs. Think of them as labeled boxes where you can put different types of information and retrieve them later when needed.

## Why Do We Need Variables?

Imagine you're building a calculator app. Without variables, you'd have to write the same numbers over and over again. Variables let you store values once and reuse them throughout your program.

## Basic Variable Concepts

When you create a variable, you're essentially:
1. **Declaring** - Telling JavaScript "I want to create a container"
2. **Naming** - Giving your container a meaningful name
3. **Initializing** - Putting a value into the container

Variables make your code more readable, maintainable, and flexible. Instead of hardcoding values, you can use descriptive names that make your intentions clear.
      `,
      order: 1,
      quiz: {
        questions: [
          {
            question:
              "What is the primary purpose of variables in programming?",
            options: [
              "To make code look more complex",
              "To store and manipulate data values",
              "To slow down program execution",
              "To replace all numbers in code",
            ],
            correctAnswer: 1,
            explanation:
              "Variables are containers that store data values, making it easy to reuse and manipulate information throughout your program.",
          },
          {
            question:
              "Which of the following best describes variable declaration?",
            options: [
              "Putting a value into a variable",
              "Telling JavaScript you want to create a container",
              "Deleting a variable from memory",
              "Converting a variable to a different type",
            ],
            correctAnswer: 1,
            explanation:
              "Declaration is the process of telling JavaScript that you want to create a variable container, even before you put any value in it.",
          },
          {
            question: "What makes variables better than hardcoded values?",
            options: [
              "They use more memory",
              "They make code harder to read",
              "They make code more readable and maintainable",
              "They are slower to execute",
            ],
            correctAnswer: 2,
            explanation:
              "Variables with descriptive names make code more readable and easier to maintain because they clearly express the purpose of the stored values.",
          },
          {
            question:
              "In the calculator app example, why are variables useful?",
            options: [
              "They make the app run faster",
              "They allow reusing values instead of repeating numbers",
              "They make the code longer",
              "They are required by JavaScript",
            ],
            correctAnswer: 1,
            explanation:
              "Variables allow you to store values once and reuse them multiple times, avoiding repetition and making your code more efficient.",
          },
          {
            question:
              "What are the three basic steps when working with variables?",
            options: [
              "Create, delete, modify",
              "Declare, name, initialize",
              "Start, stop, restart",
              "Input, process, output",
            ],
            correctAnswer: 1,
            explanation:
              "The three basic steps are: declaring (creating the container), naming (giving it a meaningful name), and initializing (putting a value in it).",
          },
        ],
      },
    },
    {
      id: "section-2",
      title: "Variable Keywords: var, let, and const",
      summary:
        "Explore the three different ways to declare variables in JavaScript and understand when to use each one.",
      learningObjectives: [
        "Distinguish between var, let, and const keywords",
        "Understand scope differences between variable types",
        "Choose the appropriate keyword for different situations",
      ],
      content: `
JavaScript provides three keywords for declaring variables: \`var\`, \`let\`, and \`const\`. Each has its own characteristics and use cases.

## The \`var\` Keyword

\`var\` is the oldest way to declare variables in JavaScript. It has function scope and can be redeclared and updated.

\`\`\`javascript
var name = "John";
var name = "Jane"; // This is allowed
name = "Bob"; // This is also allowed
\`\`\`

## The \`let\` Keyword

\`let\` was introduced in ES6 (2015) and has block scope. It can be updated but not redeclared in the same scope.

\`\`\`javascript
let age = 25;
age = 26; // This is allowed
// let age = 27; // This would cause an error
\`\`\`

## The \`const\` Keyword

\`const\` creates constants - variables that cannot be reassigned after declaration. They must be initialized when declared.

\`\`\`javascript
const PI = 3.14159;
// PI = 3.14; // This would cause an error
\`\`\`

## Best Practices

- Use \`const\` by default for values that won't change
- Use \`let\` when you need to reassign the variable
- Avoid \`var\` in modern JavaScript due to scope issues
      `,
      order: 2,
      quiz: {
        questions: [
          {
            question:
              "Which keyword should you use for a value that will never change?",
            options: ["var", "let", "const", "variable"],
            correctAnswer: 2,
            explanation:
              "const is used for constants - values that cannot be reassigned after declaration.",
          },
          {
            question: "What happens when you try to reassign a const variable?",
            options: [
              "It works normally",
              "It creates a new variable",
              "It throws an error",
              "It converts to let",
            ],
            correctAnswer: 2,
            explanation:
              "Attempting to reassign a const variable will throw a TypeError because const variables are immutable.",
          },
          {
            question:
              "Which keyword has block scope and was introduced in ES6?",
            options: ["var", "let", "const", "Both let and const"],
            correctAnswer: 3,
            explanation:
              "Both let and const were introduced in ES6 and have block scope, unlike var which has function scope.",
          },
          {
            question:
              "What is the main problem with using var in modern JavaScript?",
            options: [
              "It is too slow",
              "It has scope issues",
              "It uses too much memory",
              "It is not supported",
            ],
            correctAnswer: 1,
            explanation:
              "var has function scope which can lead to unexpected behavior and bugs, especially in loops and conditional blocks.",
          },
          {
            question: "Which statement about const is true?",
            options: [
              "It can be declared without initialization",
              "It must be initialized when declared",
              "It can be reassigned later",
              "It has function scope",
            ],
            correctAnswer: 1,
            explanation:
              "const variables must be initialized with a value at the time of declaration and cannot be left undefined.",
          },
        ],
      },
    },
  ],
};

interface LessonPageProps {
  params: {
    id: string;
  };
}

export default function LessonPage({ params }: LessonPageProps) {
  const lesson = mockLesson; // In real app, fetch by params.id
  const currentSection = lesson.sections[0]; // For demo, showing first section

  const handleQuizComplete = (score: number, answers: number[]) => {
    console.log("Quiz completed:", { score, answers });
  };

  return (
    <div className="lesson-page">
      <div className="lesson-header">
        <h1 className="lesson-title">{lesson.title}</h1>
        <div className="lesson-meta">
          <span className="lesson-sections">
            {lesson.sections.length} sections
          </span>
          <span className="lesson-date">
            Created {lesson.createdAt.toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="lesson-content">
        {/* Video Section */}
        <Card className="lesson-video-card">
          <CardContent>
            <div className="lesson-video">
              <iframe
                width="100%"
                height="400"
                src={`https://www.youtube.com/embed/${lesson.videoId}`}
                title={lesson.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </CardContent>
        </Card>

        {/* Section Content */}
        <Card className="lesson-section-card">
          <CardHeader>
            <div className="section-header">
              <h2 className="section-title">{currentSection.title}</h2>
              <span className="section-number">
                Section {currentSection.order} of {lesson.sections.length}
              </span>
            </div>
            <p className="section-summary">{currentSection.summary}</p>
          </CardHeader>

          <CardContent>
            {/* Learning Objectives */}
            <div className="learning-objectives">
              <h3>Learning Objectives</h3>
              <ul>
                {currentSection.learningObjectives.map((objective, index) => (
                  <li key={index}>{objective}</li>
                ))}
              </ul>
            </div>

            {/* Section Content */}
            <div className="section-content">
              <div
                dangerouslySetInnerHTML={{
                  __html: currentSection.content.replace(/\n/g, "<br/>"),
                }}
              />
            </div>
          </CardContent>

          <CardFooter>
            <div className="section-navigation">
              <Button variant="secondary" disabled>
                Previous Section
              </Button>
              <Button>Next Section</Button>
            </div>
          </CardFooter>
        </Card>

        {/* Quiz Section */}
        <div className="lesson-quiz">
          <h3 className="quiz-section-title">Section Quiz</h3>
          <p className="quiz-section-description">
            Test your understanding of the concepts covered in this section.
          </p>
          <Quiz
            questions={currentSection.quiz.questions}
            onComplete={handleQuizComplete}
          />
        </div>
      </div>
    </div>
  );
}
