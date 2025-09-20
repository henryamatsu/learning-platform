import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GetLessonsResponse } from '@/lib/types/lesson';

// GET /api/lessons - Get all lessons
export async function GET(request: NextRequest) {
  try {
    const userId = 'default'; // In a real app, get from authentication

    const lessons = await prisma.lesson.findMany({
      include: {
        sections: {
          orderBy: {
            order: 'asc'
          },
          include: {
            quiz: true
          }
        },
        progress: {
          where: { userId },
          include: {
            sectionProgress: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the data to match our LessonWithProgress interface
    const transformedLessons = lessons.map(lesson => ({
      lesson: {
        ...lesson,
        sections: lesson.sections.map(section => ({
          ...section,
          learningObjectives: JSON.parse(section.learningObjectives),
          quiz: section.quiz ? {
            ...section.quiz,
            questions: JSON.parse(section.quiz.questions)
          } : undefined
        }))
      },
      progress: lesson.progress[0] || null
    }));

    const response: GetLessonsResponse = {
      lessons: transformedLessons,
      success: true
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json(
      { 
        lessons: [], 
        success: false, 
        message: 'Failed to fetch lessons' 
      },
      { status: 500 }
    );
  }
}

// POST /api/lessons - Create a new lesson (basic version, will be enhanced later)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, videoUrl, videoId, sections } = body;

    if (!title || !videoUrl || !videoId) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields: title, videoUrl, videoId' 
        },
        { status: 400 }
      );
    }

    const lesson = await prisma.lesson.create({
      data: {
        title,
        videoUrl,
        videoId,
        sections: {
          create: sections?.map((section: any, index: number) => ({
            title: section.title,
            summary: section.summary,
            content: section.content,
            learningObjectives: JSON.stringify(section.learningObjectives || []),
            order: index + 1,
            quiz: section.quiz ? {
              create: {
                questions: JSON.stringify(section.quiz.questions || [])
              }
            } : undefined
          })) || []
        }
      },
      include: {
        sections: {
          orderBy: {
            order: 'asc'
          },
          include: {
            quiz: true
          }
        }
      }
    });

    // Transform the response data
    const transformedLesson = {
      ...lesson,
      sections: lesson.sections.map(section => ({
        ...section,
        learningObjectives: JSON.parse(section.learningObjectives),
        quiz: section.quiz ? {
          ...section.quiz,
          questions: JSON.parse(section.quiz.questions)
        } : undefined
      }))
    };

    return NextResponse.json({
      lesson: transformedLesson,
      success: true,
      message: 'Lesson created successfully'
    });
  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create lesson' 
      },
      { status: 500 }
    );
  }
}
