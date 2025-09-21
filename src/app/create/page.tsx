"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "../../components/ui/Card";

interface LessonCreationProgress {
  step:
    | "validating"
    | "extracting"
    | "generating"
    | "saving"
    | "completed"
    | "error";
  message: string;
  progress: number;
  error?: string;
}

export default function CreateLessonPage() {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<LessonCreationProgress | null>(null);
  const [createdLessonId, setCreatedLessonId] = useState<string | null>(null);

  const validateYouTubeUrl = (url: string) => {
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
    return youtubeRegex.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("handleSubmit called!");
    e.preventDefault();
    console.log("Form submitted with URL:", videoUrl);
    setError("");
    setProgress(null);
    setCreatedLessonId(null);

    if (!videoUrl.trim()) {
      console.log("Error: No URL provided");
      setError("Please enter a YouTube video URL");
      return;
    }

    if (!validateYouTubeUrl(videoUrl)) {
      console.log("Error: Invalid YouTube URL");
      setError("Please enter a valid YouTube video URL");
      return;
    }

    console.log("Starting lesson creation...");
    setIsLoading(true);

    try {
      const response = await fetch("/api/lessons/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoUrl }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create lesson");
      }

      // Show final progress
      if (data.progress && data.progress.length > 0) {
        const finalProgress = data.progress[data.progress.length - 1];
        setProgress(finalProgress);
      }

      // Set the created lesson ID for redirect
      if (data.lesson && data.lesson.id) {
        setCreatedLessonId(data.lesson.id);

        // Auto-redirect after 2 seconds
        setTimeout(() => {
          router.push(`/lesson/${data.lesson.id}`);
        }, 2000);
      }
    } catch (err) {
      console.error("Error creating lesson:", err);
      setError(err instanceof Error ? err.message : "Failed to create lesson");
      setProgress({
        step: "error",
        message: "Failed to create lesson",
        progress: 0,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoUrl(e.target.value);
    if (error) setError("");
    if (progress?.step === "error") setProgress(null);
  };

  const getProgressColor = (step: string) => {
    switch (step) {
      case "completed":
        return "#059669";
      case "error":
        return "#ef4444";
      default:
        return "#3b82f6";
    }
  };

  const getProgressIcon = (step: string) => {
    switch (step) {
      case "validating":
        return "🔍";
      case "extracting":
        return "📝";
      case "generating":
        return "🤖";
      case "saving":
        return "💾";
      case "completed":
        return "✅";
      case "error":
        return "❌";
      default:
        return "⏳";
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Create New Lesson</h1>
        <p className="page-description">
          Enter a YouTube video URL and our AI will automatically generate a
          structured learning course with lessons, summaries, and interactive
          quizzes.
        </p>
      </div>

      <div className="create-lesson-container">
        <Card className="create-lesson-card">
          <CardHeader>
            <h2 className="create-lesson__title">Generate AI-Powered Lesson</h2>
            <p className="create-lesson__subtitle">
              Transform any educational YouTube video into an interactive
              learning experience
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="create-lesson-form">
              <Input
                id="youtube-url-input"
                label="YouTube Video URL"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={handleUrlChange}
                error={error}
                required
                disabled={isLoading}
              />

              <div className="create-lesson__info">
                <h4>What happens next?</h4>
                <ul className="create-lesson__steps">
                  <li>🎥 We\&apos;ll extract the video transcript</li>
                  <li>
                    🤖 AI analyzes the content and creates structured sections
                  </li>
                  <li>📝 Generate learning objectives and summaries</li>
                  <li>❓ Create interactive quizzes for each section</li>
                  <li>🎯 Track your progress as you learn</li>
                </ul>
              </div>

              {(isLoading || progress) && (
                <div className="create-lesson__loading">
                  {progress ? (
                    <div className="progress-display">
                      <div className="progress-header">
                        <span className="progress-icon">
                          {getProgressIcon(progress.step)}
                        </span>
                        <span className="progress-message">
                          {progress.message}
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${progress.progress}%`,
                            backgroundColor: getProgressColor(progress.step),
                          }}
                        />
                      </div>
                      <div className="progress-percentage">
                        {progress.progress}%
                      </div>
                      {progress.error && (
                        <div className="progress-error">
                          <strong>Error:</strong> {progress.error}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="loading-text">
                      <div className="loading-spinner"></div>
                      Starting lesson creation...
                    </div>
                  )}

                  {createdLessonId && (
                    <div className="success-message">
                      <p>✅ Lesson created successfully!</p>
                      <p>Redirecting to your new lesson...</p>
                    </div>
                  )}
                </div>
              )}

              <div className="create-lesson__actions">
                {createdLessonId ? (
                  <Button
                    onClick={() => router.push(`/lesson/${createdLessonId}`)}
                    className="create-lesson__submit"
                  >
                    View Lesson
                  </Button>
                ) : (
                  <>
                    <Button
                      type="submit"
                      disabled={isLoading || !videoUrl.trim()}
                      className="create-lesson__submit"
                    >
                      {isLoading ? "Creating Lesson..." : "Create Lesson"}
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={isLoading}
                      onClick={() => {
                        setVideoUrl("");
                        setError("");
                        setProgress(null);
                        setCreatedLessonId(null);
                      }}
                    >
                      Clear
                    </Button>
                  </>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="create-lesson-tips">
          <CardHeader>
            <h3>💡 Tips for Best Results</h3>
          </CardHeader>
          <CardContent>
            <ul className="tips-list">
              <li>
                <strong>Educational Content:</strong> Choose videos that teach
                concepts, skills, or provide tutorials
              </li>
              <li>
                <strong>Clear Audio:</strong> Videos with clear narration work
                best for transcript extraction
              </li>
              <li>
                <strong>Appropriate Length:</strong> 5-60 minute videos generate
                the most effective lessons
              </li>
              <li>
                <strong>Structured Content:</strong> Videos with clear topics
                and explanations create better sections
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
