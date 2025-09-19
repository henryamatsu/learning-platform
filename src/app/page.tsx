import Link from "next/link";
import { Button } from "../components/ui/Button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "../components/ui/Card";

// Mock data for demonstration
const mockLessons = [
  {
    id: "1",
    title: "Introduction to JavaScript Variables",
    videoUrl: "https://www.youtube.com/watch?v=example1",
    createdAt: new Date("2024-01-15"),
    totalSections: 2,
    completedSections: 2,
    progress: 100,
  },
  {
    id: "2",
    title: "React Hooks Explained",
    videoUrl: "https://www.youtube.com/watch?v=example2",
    createdAt: new Date("2024-01-10"),
    totalSections: 4,
    completedSections: 2,
    progress: 50,
  },
  {
    id: "3",
    title: "CSS Grid Layout Tutorial",
    videoUrl: "https://www.youtube.com/watch?v=example3",
    createdAt: new Date("2024-01-05"),
    totalSections: 3,
    completedSections: 0,
    progress: 0,
  },
];

export default function CurrentLessonsPage() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Current Lessons</h1>
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

      {mockLessons.length === 0 ? (
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
      ) : (
        <div className="lessons-grid">
          {mockLessons.map((lesson) => (
            <Card key={lesson.id} className="lesson-card" hover>
              <CardHeader>
                <h3 className="lesson-card__title">{lesson.title}</h3>
                <div className="lesson-card__meta">
                  <span className="lesson-card__progress">
                    {lesson.progress}% Complete ({lesson.completedSections}/
                    {lesson.totalSections} sections)
                  </span>
                  <span className="lesson-card__date">
                    Created {lesson.createdAt.toLocaleDateString()}
                  </span>
                </div>
              </CardHeader>

              <CardContent>
                <div className="lesson-card__progress-bar">
                  <div
                    className="lesson-card__progress-fill"
                    style={{ width: `${lesson.progress}%` }}
                  />
                </div>
                <p className="lesson-card__description">
                  {lesson.totalSections} sections • Interactive quizzes •
                  AI-generated content
                </p>
              </CardContent>

              <CardFooter>
                <div className="lesson-card__actions">
                  <Link href={`/lesson/${lesson.id}`}>
                    <Button>
                      {lesson.progress === 0
                        ? "Start Lesson"
                        : lesson.progress === 100
                        ? "Review Lesson"
                        : "Continue Lesson"}
                    </Button>
                  </Link>
                  <Button variant="secondary" size="small">
                    View Details
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
