import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const { quizId } = params;
    const userId = 'default'; // For now, using default user

    if (!quizId) {
      return NextResponse.json(
        { success: false, message: 'Quiz ID is required' },
        { status: 400 }
      );
    }

    // Get existing quiz result for this user and quiz
    const quizResult = await prisma.quizResult.findFirst({
      where: {
        quizId: quizId,
        userId: userId,
      },
      orderBy: {
        completedAt: 'desc', // Get the most recent attempt
      },
    });

    return NextResponse.json({
      success: true,
      result: quizResult,
    });
  } catch (error) {
    console.error('Error fetching quiz result:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch quiz result' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const { quizId } = params;
    const { answers, score, totalQuestions } = await request.json();
    const userId = 'default'; // For now, using default user

    if (!quizId || !answers || score === undefined || !totalQuestions) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      return NextResponse.json(
        { success: false, message: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Delete any existing result for this user and quiz (replace with new attempt)
    await prisma.quizResult.deleteMany({
      where: {
        quizId: quizId,
        userId: userId,
      },
    });

    // Create new quiz result
    const quizResult = await prisma.quizResult.create({
      data: {
        quizId: quizId,
        userId: userId,
        answers: JSON.stringify(answers),
        score: score,
        totalQuestions: totalQuestions,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Quiz result saved successfully',
      result: quizResult,
    });
  } catch (error) {
    console.error('Error saving quiz result:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save quiz result' },
      { status: 500 }
    );
  }
}
