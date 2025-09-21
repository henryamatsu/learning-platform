"use client";

import { useState, useEffect, useCallback } from "react";

export interface QuizState {
  currentQuestion: number;
  selectedAnswers: number[];
  showResults: boolean;
  submitted: boolean;
  checkedAnswers: boolean[];
}

export interface UseQuizReturn {
  quizState: QuizState;
  loadQuizResult: () => Promise<void>;
  saveQuizResult: (answers: number[], score: number, totalQuestions: number) => Promise<void>;
  updateQuizState: (newState: Partial<QuizState>) => void;
  resetQuiz: () => void;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for managing quiz state with database persistence
 */
export function useQuiz(quizId: string, totalQuestions: number): UseQuizReturn {
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestion: 0,
    selectedAnswers: new Array(totalQuestions).fill(-1),
    showResults: false,
    submitted: false,
    checkedAnswers: new Array(totalQuestions).fill(false),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuizResult = useCallback(async () => {
    if (!quizId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/quiz/${quizId}/result`);
      const data = await response.json();

      if (data.success && data.result) {
        // Quiz was previously completed, restore the state
        const answers = JSON.parse(data.result.answers);
        setQuizState({
          currentQuestion: totalQuestions - 1, // Go to last question
          selectedAnswers: answers,
          showResults: true,
          submitted: true,
          checkedAnswers: new Array(totalQuestions).fill(true),
        });
      } else {
        // No previous result, start fresh
        resetQuiz();
      }
    } catch (err) {
      console.error('Error loading quiz result:', err);
      setError('Failed to load quiz progress');
      resetQuiz();
    } finally {
      setLoading(false);
    }
  }, [quizId, totalQuestions]);

  const saveQuizResult = useCallback(async (answers: number[], score: number, totalQuestions: number) => {
    if (!quizId) return;

    try {
      setError(null);

      const response = await fetch(`/api/quiz/${quizId}/result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers,
          score,
          totalQuestions,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to save quiz result');
      }
    } catch (err) {
      console.error('Error saving quiz result:', err);
      setError('Failed to save quiz progress');
    }
  }, [quizId]);

  const updateQuizState = useCallback((newState: Partial<QuizState>) => {
    setQuizState(prev => ({ ...prev, ...newState }));
  }, []);

  const resetQuiz = useCallback(() => {
    setQuizState({
      currentQuestion: 0,
      selectedAnswers: new Array(totalQuestions).fill(-1),
      showResults: false,
      submitted: false,
      checkedAnswers: new Array(totalQuestions).fill(false),
    });
  }, [totalQuestions]);

  // Load quiz result on mount
  useEffect(() => {
    loadQuizResult();
  }, [loadQuizResult]);

  return {
    quizState,
    loadQuizResult,
    saveQuizResult,
    updateQuizState,
    resetQuiz,
    loading,
    error,
  };
}
