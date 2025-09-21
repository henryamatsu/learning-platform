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
  progress: any = null,
  onProgressUpdate?: () => void
): UseSectionReturn {
  const [currentSection, setCurrentSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<number[]>([]);

  // Initialize from progress data
  useEffect(() => {
    console.log("🔍 Progress parsing - Raw progress:", progress);
    console.log("🔍 Progress parsing - Lesson sections:", lesson?.sections?.map(s => s.id));
    
    if (progress && progress.sectionProgress) {
      console.log("🔍 Progress parsing - Section progress:", progress.sectionProgress);
      
      // Parse completed sections from progress data
      const completed = progress.sectionProgress
        .filter((sp: any) => sp.completedAt) // Check if section is completed
        .map((sp: any) => {
          // Find the section index by matching section ID
          if (lesson && lesson.sections) {
            const index = lesson.sections.findIndex(section => section.id === sp.sectionId);
            console.log(`🔍 Progress parsing - Section ${sp.sectionId} maps to index ${index}`);
            return index;
          }
          return -1;
        })
        .filter((index: number) => index !== -1); // Remove invalid indices
      
      console.log("🔍 Progress parsing - Final completed sections:", completed);
      setCompletedSections(completed);
    } else {
      console.log("🔍 Progress parsing - No progress data, setting empty");
      setCompletedSections([]);
    }
  }, [progress, lesson]);

  const totalSections = lesson?.sections?.length || 0;

  const canNavigateNext = currentSection < totalSections - 1 && 
    (completedSections.includes(currentSection) || currentSection === 0);
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
    console.log("🎯 markSectionComplete called with sectionIndex:", sectionIndex);
    console.log("🎯 Current completedSections:", completedSections);
    
    setCompletedSections((prev) => {
      console.log("🎯 Previous completed sections:", prev);
      
      if (!prev.includes(sectionIndex)) {
        const newCompleted = [...prev, sectionIndex];
        console.log("🎯 New completed sections:", newCompleted);
        
        // Persist to database
        if (lesson?.id) {
          console.log("🎯 Saving to database - lesson ID:", lesson.id);
          console.log("🎯 Saving to database - payload:", {
            currentSection,
            completedSections: newCompleted
          });
          
          fetch(`/api/lessons/${lesson.id}/progress`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              currentSection,
              completedSections: newCompleted
            })
          })
          .then(response => response.json())
          .then(data => {
            console.log("🎯 Database response:", data);
            if (data.success && onProgressUpdate) {
              console.log("🎯 Calling onProgressUpdate to refresh data");
              // Refresh the progress data from parent
              onProgressUpdate();
            }
          })
          .catch(error => {
            console.error('🎯 Failed to save progress:', error);
          });
        }
        
        return newCompleted;
      } else {
        console.log("🎯 Section already completed, no change");
      }
      return prev;
    });
  }, [lesson?.id, currentSection, onProgressUpdate]);


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
