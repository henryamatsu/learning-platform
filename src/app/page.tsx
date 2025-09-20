"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "../components/ui/Button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "../components/ui/Card";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { useLessons } from "../hooks/useLessons";
import { logUserAction } from "../lib/utils/errorLogger";

export default function CurrentLessonsPage() {
  const { lessons, loading, error, refetch, deleteLesson } = useLessons();
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    lessonId: string;
    lessonTitle: string;
  }>({
    isOpen: false,
    lessonId: "",
    lessonTitle: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (lessonId: string, lessonTitle: string) => {
    logUserAction("delete_lesson_dialog_opened", { lessonId, lessonTitle });
    setDeleteDialog({
      isOpen: true,
      lessonId,
      lessonTitle,
    });
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    const success = await deleteLesson(deleteDialog.lessonId);

    if (success) {
      logUserAction("delete_lesson_confirmed", {
        lessonId: deleteDialog.lessonId,
        lessonTitle: deleteDialog.lessonTitle,
      });
    }

    setIsDeleting(false);
    setDeleteDialog({ isOpen: false, lessonId: "", lessonTitle: "" });
  };

  const handleDeleteCancel = () => {
    logUserAction("delete_lesson_cancelled", {
      lessonId: deleteDialog.lessonId,
    });
    setDeleteDialog({ isOpen: false, lessonId: "", lessonTitle: "" });
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Your Lessons</h1>
          <p className="page-description">Loading your lessons...</p>
        </div>
        <div className="lessons-loading">
          <div className="loading-spinner"></div>
          <p>Loading lessons...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Your Lessons</h1>
          <p className="page-description">Error loading lessons</p>
        </div>
        <div className="lessons-error">
          <p>❌ {error}</p>
          <Button onClick={refetch}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Your Lessons</h1>
          <p className="page-description">
            You haven&apos;t created any lessons yet. Start by adding a YouTube
            video!
          </p>
        </div>
        <div className="empty-state">
          <div className="empty-state__icon">📚</div>
          <h2 className="empty-state__title">No lessons yet</h2>
          <p className="empty-state__description">
            Get started by creating your first lesson from a YouTube video. Our
            AI will automatically generate structured content with quizzes to
            help you learn.
          </p>
          <Link href="/create">
            <Button>Create Your First Lesson</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div>
        <div className="page-header">
          <h1 className="page-title">Your Lessons</h1>
          <p className="page-description">
            View and continue your AI-generated learning courses from YouTube
            videos.
          </p>
          <div className="page-actions">
            <Link href="/create">
              <Button>Create New Lesson</Button>
            </Link>
          </div>
        </div>

        <div className="lessons-grid">
          {lessons.map(({ lesson, progress }) => {
            const completedSections = progress?.completedSections || 0;
            const totalSections = lesson.sections?.length || 0;
            const progressPercentage =
              totalSections > 0
                ? Math.round((completedSections / totalSections) * 100)
                : 0;

            return (
              <Card key={lesson.id} className="lesson-card" hover>
                <CardHeader>
                  <h3 className="lesson-card__title">{lesson.title}</h3>
                  <div className="lesson-card__meta">
                    <span className="lesson-card__progress">
                      {progressPercentage}% Complete ({completedSections}/
                      {totalSections} sections)
                    </span>
                    <span className="lesson-card__date">
                      Created {new Date(lesson.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="lesson-card__progress-bar">
                    <div
                      className="lesson-card__progress-fill"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <p className="lesson-card__description">
                    {totalSections} sections • Interactive quizzes •
                    AI-generated content
                  </p>
                  {lesson.videoUrl && (
                    <div className="lesson-card__video">
                      <a
                        href={lesson.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="lesson-card__video-link"
                      >
                        📺 View Original Video
                      </a>
                    </div>
                  )}
                </CardContent>

                <CardFooter>
                  <div className="lesson-card__actions">
                    <Link href={`/lesson/${lesson.id}`}>
                      <Button>
                        {progressPercentage === 0
                          ? "Start Lesson"
                          : progressPercentage === 100
                          ? "Review Lesson"
                          : "Continue Lesson"}
                      </Button>
                    </Link>
                    <Link href={`/lesson/${lesson.id}`}>
                      <Button variant="secondary" size="small">
                        View Details
                      </Button>
                    </Link>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => handleDeleteClick(lesson.id, lesson.title)}
                      className="lesson-card__delete-btn"
                    >
                      🗑️ Delete
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <ConfirmDialog
          isOpen={deleteDialog.isOpen}
          title="Delete Lesson"
          message={`Are you sure you want to delete "${deleteDialog.lessonTitle}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          confirmVariant="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          loading={isDeleting}
        />
      </div>
    </ErrorBoundary>
  );
}
