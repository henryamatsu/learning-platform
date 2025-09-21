"use client";

import { useState, useEffect, useCallback } from "react";
import type { Lesson, LessonWithProgress } from "@/lib/types/lesson";
import { apiRequest } from "@/lib/utils/apiErrorHandler";
import { logApiError, logUserAction } from "@/lib/utils/errorLogger";

export interface UseLessonsReturn {
  lessons: LessonWithProgress[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  deleteLesson: (lessonId: string) => Promise<boolean>;
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

      const data = await apiRequest("/api/lessons");
      setLessons(data.lessons || []);
    } catch (err: any) {
      logApiError("/api/lessons", "GET", err.status || 0, err);
      setError(err.message || "Failed to fetch lessons");
      setLessons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const deleteLesson = useCallback(async (lessonId: string): Promise<boolean> => {
    try {
      logUserAction("delete_lesson_attempt", { lessonId });
      
      await apiRequest(`/api/lessons/${lessonId}`, {
        method: "DELETE",
      });

      // Remove from local state
      setLessons(prev => prev.filter(item => item.lesson.id !== lessonId));
      
      logUserAction("delete_lesson_success", { lessonId });
      return true;
    } catch (err: any) {
      logApiError(`/api/lessons/${lessonId}`, "DELETE", err.status || 0, err);
      return false;
    }
  }, []);

  return {
    lessons,
    loading,
    error,
    refetch: fetchLessons,
    deleteLesson,
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
      setError("No lesson ID provided");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await apiRequest(`/api/lessons/${lessonId}`);
      setLesson(data.lesson);
      setProgress(data.progress);
    } catch (err: any) {
      logApiError(`/api/lessons/${lessonId}`, "GET", err.status || 0, err);
      setError(err.message || "Failed to fetch lesson");
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
    refetch: fetchLesson,
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
      setCurrentSection((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [canNavigateNext]);

  const goToPreviousSection = useCallback(() => {
    if (canNavigatePrevious) {
      setCurrentSection((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [canNavigatePrevious]);

  const goToSection = useCallback(
    (sectionIndex: number) => {
      if (sectionIndex >= 0 && sectionIndex < totalSections) {
        setCurrentSection(sectionIndex);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [totalSections]
  );

  const markSectionComplete = useCallback(async (sectionIndex: number) => {
    setCompletedSections((prev) => {
      if (!prev.includes(sectionIndex)) {
        const newCompleted = [...prev, sectionIndex];
        
        // Persist to database
        if (lesson?.id) {
          fetch(`/api/lessons/${lesson.id}/progress`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              currentSection,
              completedSections: newCompleted
            })
          }).catch(error => {
            console.error('Failed to save progress:', error);
          });
        }
        
        return newCompleted;
      }
      return prev;
    });
  }, [lesson?.id, currentSection]);


  return {
    currentSection,
    setCurrentSection,
    canNavigateNext,
    canNavigatePrevious,
    goToNextSection,
    goToPreviousSection,
    goToSection,
    completedSections,
    markSectionComplete,
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
    averageSectionsPerLesson: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/lessons/stats");
        if (!response.ok) {
          throw new Error("Failed to fetch lesson statistics");
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error("Error fetching lesson stats:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch statistics"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
}
