"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Lesson, LessonWithProgress } from '@/lib/types/lesson';

export interface UseLessonsReturn {
  lessons: LessonWithProgress[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching all lessons with progress data
 */
export function useLessons(): UseLessonsReturn {
  const [lessons, setLessons] = useState<LessonWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLessons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/lessons');
      if (!response.ok) {
        throw new Error(`Failed to fetch lessons: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch lessons');
      }

      setLessons(data.lessons || []);
    } catch (err) {
      console.error('Error fetching lessons:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch lessons');
      setLessons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  return {
    lessons,
    loading,
    error,
    refetch: fetchLessons
  };
}

export interface UseLessonReturn {
  lesson: Lesson | null;
  progress: any;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching a single lesson with progress data
 */
export function useLesson(lessonId: string): UseLessonReturn {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLesson = useCallback(async () => {
    if (!lessonId) {
      setError('No lesson ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/lessons/${lessonId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Lesson not found');
        }
        throw new Error(`Failed to fetch lesson: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch lesson');
      }

      setLesson(data.lesson);
      setProgress(data.progress);
    } catch (err) {
      console.error('Error fetching lesson:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch lesson');
      setLesson(null);
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson]);

  return {
    lesson,
    progress,
    loading,
    error,
    refetch: fetchLesson
  };
}

export interface UseSectionReturn {
  currentSection: number;
  setCurrentSection: (section: number) => void;
  canNavigateNext: boolean;
  canNavigatePrevious: boolean;
  goToNextSection: () => void;
  goToPreviousSection: () => void;
  goToSection: (sectionIndex: number) => void;
  completedSections: number[];
  markSectionComplete: (sectionIndex: number) => void;
}

/**
 * Hook for managing section navigation within a lesson
 */
export function useSectionNavigation(
  lesson: Lesson | null,
  progress: any = null
): UseSectionReturn {
  const [currentSection, setCurrentSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<number[]>([]);

  // Initialize from progress data
  useEffect(() => {
    if (progress) {
      setCurrentSection(progress.currentSection || 0);
      // Parse completed sections from progress data if available
      if (progress.sectionProgress) {
        const completed = progress.sectionProgress
          .filter((sp: any) => sp.completed)
          .map((sp: any) => sp.sectionOrder - 1); // Convert to 0-based index
        setCompletedSections(completed);
      }
    }
  }, [progress]);

  const totalSections = lesson?.sections?.length || 0;

  const canNavigateNext = currentSection < totalSections - 1;
  const canNavigatePrevious = currentSection > 0;

  const goToNextSection = useCallback(() => {
    if (canNavigateNext) {
      setCurrentSection(prev => prev + 1);
    }
  }, [canNavigateNext]);

  const goToPreviousSection = useCallback(() => {
    if (canNavigatePrevious) {
      setCurrentSection(prev => prev - 1);
    }
  }, [canNavigatePrevious]);

  const goToSection = useCallback((sectionIndex: number) => {
    if (sectionIndex >= 0 && sectionIndex < totalSections) {
      setCurrentSection(sectionIndex);
    }
  }, [totalSections]);

  const markSectionComplete = useCallback((sectionIndex: number) => {
    setCompletedSections(prev => {
      if (!prev.includes(sectionIndex)) {
        return [...prev, sectionIndex];
      }
      return prev;
    });
  }, []);

  return {
    currentSection,
    setCurrentSection,
    canNavigateNext,
    canNavigatePrevious,
    goToNextSection,
    goToPreviousSection,
    goToSection,
    completedSections,
    markSectionComplete
  };
}

/**
 * Hook for lesson statistics
 */
export function useLessonStats() {
  const [stats, setStats] = useState({
    totalLessons: 0,
    totalSections: 0,
    totalQuizzes: 0,
    averageSectionsPerLesson: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/lessons/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch lesson statistics');
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching lesson stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
}
