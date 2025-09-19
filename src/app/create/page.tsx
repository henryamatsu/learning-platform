"use client";

import React, { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "../../components/ui/Card";

export default function CreateLessonPage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const validateYouTubeUrl = (url: string) => {
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
    return youtubeRegex.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!videoUrl.trim()) {
      setError("Please enter a YouTube video URL");
      return;
    }

    if (!validateYouTubeUrl(videoUrl)) {
      setError("Please enter a valid YouTube video URL");
      return;
    }

    setIsLoading(true);

    // Simulate API call for now
    setTimeout(() => {
      setIsLoading(false);
      // In real implementation, this would redirect to the new lesson
      console.log("Creating lesson for:", videoUrl);
    }, 3000);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoUrl(e.target.value);
    if (error) setError("");
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
                  <li>🎥 We'll extract the video transcript</li>
                  <li>
                    🤖 AI analyzes the content and creates structured sections
                  </li>
                  <li>📝 Generate learning objectives and summaries</li>
                  <li>❓ Create interactive quizzes for each section</li>
                  <li>🎯 Track your progress as you learn</li>
                </ul>
              </div>

              {isLoading && (
                <div className="create-lesson__loading">
                  <div className="loading-text">
                    <div className="loading-spinner"></div>
                    Generating your lesson... This may take a few minutes.
                  </div>
                  <p className="create-lesson__loading-details">
                    We're extracting the transcript and creating personalized
                    learning content for you.
                  </p>
                </div>
              )}
            </form>
          </CardContent>

          <CardFooter>
            <div className="create-lesson__actions">
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={isLoading || !videoUrl.trim()}
                className="create-lesson__submit"
              >
                {isLoading ? "Generating Lesson..." : "Create Lesson"}
              </Button>
              <Button
                variant="secondary"
                disabled={isLoading}
                onClick={() => {
                  setVideoUrl("");
                  setError("");
                }}
              >
                Clear
              </Button>
            </div>
          </CardFooter>
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
