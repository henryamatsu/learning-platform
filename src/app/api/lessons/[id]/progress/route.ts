import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';

// PUT /api/lessons/[id]/progress - Update lesson progress
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { currentSection, completedSections } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Lesson ID is required' },
        { status: 400 }
      );
    }

    // Get the lesson to know total sections
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: { sections: true }
    });

    if (!lesson) {
      return NextResponse.json(
        { success: false, message: 'Lesson not found' },
        { status: 404 }
      );
    }

    const totalSections = lesson.sections.length;

    // First, find or create user progress
    let progress = await prisma.userProgress.findFirst({
      where: {
        lessonId: id,
        userId: 'default' // For now, using default user
      }
    });

    if (!progress) {
      // Create new progress record
      progress = await prisma.userProgress.create({
        data: {
          lessonId: id,
          userId: 'default',
          totalSections: totalSections,
          completedSections: completedSections ? completedSections.length : 0
        }
      });
    } else {
      // Update existing progress
      progress = await prisma.userProgress.update({
        where: { id: progress.id },
        data: {
          completedSections: completedSections ? completedSections.length : progress.completedSections,
          completedAt: completedSections && completedSections.length >= totalSections ? new Date() : null
        }
      });
    }

    // Update section progress
    if (completedSections && Array.isArray(completedSections)) {
      // Delete existing section progress for this user and lesson
      await prisma.sectionProgress.deleteMany({
        where: { 
          userProgressId: progress.id,
          userId: 'default'
        }
      });

      // Create new section progress records
      for (const sectionIndex of completedSections) {
        const sectionId = lesson.sections[sectionIndex]?.id;
        if (sectionId) {
          await prisma.sectionProgress.create({
            data: {
              userId: 'default',
              sectionId: sectionId,
              userProgressId: progress.id,
              completedAt: new Date()
            }
          });
        }
      }
    }

    // Fetch updated progress with section progress
    const updatedProgress = await prisma.userProgress.findUnique({
      where: { id: progress.id },
      include: {
        sectionProgress: {
          include: {
            section: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Progress updated successfully',
      progress: updatedProgress
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update progress' },
      { status: 500 }
    );
  }
}
