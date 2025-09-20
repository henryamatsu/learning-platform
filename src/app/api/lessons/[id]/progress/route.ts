import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

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
          currentSection: currentSection || 0,
          completed: false
        }
      });
    } else {
      // Update existing progress
      progress = await prisma.userProgress.update({
        where: { id: progress.id },
        data: {
          currentSection: currentSection || progress.currentSection,
          updatedAt: new Date()
        }
      });
    }

    // Update section progress
    if (completedSections && Array.isArray(completedSections)) {
      // First, get the lesson to know total sections
      const lesson = await prisma.lesson.findUnique({
        where: { id },
        include: { sections: true }
      });

      if (lesson) {
        // Delete existing section progress
        await prisma.sectionProgress.deleteMany({
          where: { progressId: progress.id }
        });

        // Create new section progress records
        const sectionProgressData = completedSections.map((sectionIndex: number) => ({
          progressId: progress.id,
          sectionOrder: sectionIndex + 1, // Convert to 1-based
          completed: true
        }));

        if (sectionProgressData.length > 0) {
          await prisma.sectionProgress.createMany({
            data: sectionProgressData
          });
        }

        // Update overall completion status
        const totalSections = lesson.sections.length;
        const isCompleted = completedSections.length >= totalSections;
        
        if (isCompleted !== progress.completed) {
          await prisma.userProgress.update({
            where: { id: progress.id },
            data: { completed: isCompleted }
          });
        }
      }
    }

    // Fetch updated progress with section progress
    const updatedProgress = await prisma.userProgress.findUnique({
      where: { id: progress.id },
      include: {
        sectionProgress: true
      }
    });

    return NextResponse.json({
      progress: updatedProgress,
      success: true,
      message: 'Progress updated successfully'
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update progress' },
      { status: 500 }
    );
  }
}
