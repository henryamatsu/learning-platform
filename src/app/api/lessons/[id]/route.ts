import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GetLessonResponse } from '@/lib/types/lesson';

// GET /api/lessons/[id] - Get a specific lesson
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Lesson ID is required' 
        },
        { status: 400 }
      );
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id },
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
          where: {
            userId: 'default' // For now, using default user
          },
          include: {
            sectionProgress: true
          }
        }
      }
    });

    if (!lesson) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Lesson not found' 
        },
        { status: 404 }
      );
    }

    // Transform the data to match our TypeScript interfaces
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

    const response: GetLessonResponse = {
      lesson: transformedLesson,
      progress: lesson.progress[0] || undefined,
      success: true
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch lesson' 
      },
      { status: 500 }
    );
  }
}

// PUT /api/lessons/[id] - Update a lesson
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { title, videoUrl, videoId } = body;

    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Lesson ID is required' 
        },
        { status: 400 }
      );
    }

    const lesson = await prisma.lesson.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(videoUrl && { videoUrl }),
        ...(videoId && { videoId })
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
      message: 'Lesson updated successfully'
    });
  } catch (error) {
    console.error('Error updating lesson:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update lesson' 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/lessons/[id] - Delete a lesson
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Lesson ID is required' 
        },
        { status: 400 }
      );
    }

    await prisma.lesson.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Lesson deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete lesson' 
      },
      { status: 500 }
    );
  }
}
