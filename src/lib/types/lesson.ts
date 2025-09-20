// Core lesson data types
export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  questions: QuizQuestion[];
  sectionId: string;
}

export interface Section {
  id: string;
  title: string;
  summary: string;
  content: string;
  learningObjectives: string[];
  order: number;
  lessonId: string;
  quiz?: Quiz;
}

export interface Lesson {
  id: string;
  title: string;
  videoUrl: string;
  videoId: string;
  createdAt: Date;
  updatedAt: Date;
  sections: Section[];
}

// Progress tracking types
export interface SectionProgress {
  id: string;
  userId: string;
  sectionId: string;
  completedAt?: Date;
}

export interface UserProgress {
  id: string;
  userId: string;
  lessonId: string;
  completedAt?: Date;
  totalSections: number;
  completedSections: number;
  currentSection: number;
  createdAt: Date;
  updatedAt: Date;
  sectionProgress: SectionProgress[];
}

export interface QuizResult {
  id: string;
  userId: string;
  quizId: string;
  answers: number[];
  score: number;
  totalQuestions: number;
  completedAt: Date;
}

// API request/response types
export interface CreateLessonRequest {
  videoUrl: string;
}

export interface CreateLessonResponse {
  lesson: Lesson | null;
  success: boolean;
  message?: string;
  progress?: any[];
}

export interface GetLessonsResponse {
  lessons: LessonWithProgress[];
  success: boolean;
}

export interface GetLessonResponse {
  lesson: Lesson;
  progress?: UserProgress;
  success: boolean;
  message?: string;
}

export interface UpdateProgressRequest {
  lessonId: string;
  sectionId: string;
  userId?: string;
}

export interface UpdateProgressResponse {
  progress: UserProgress;
  success: boolean;
  message?: string;
}

// Utility types
export interface LessonWithProgress {
  lesson: Lesson;
  progress?: UserProgress;
}

export type SectionWithQuiz = Section & {
  quiz: Quiz;
};
