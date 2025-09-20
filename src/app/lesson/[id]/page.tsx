"use client";

import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/Button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "../../../components/ui/Card";
import { Quiz } from "../../../components/quiz/Quiz";
import { SectionNavigation } from "../../../components/lesson/SectionNavigation";
import { useLesson, useSectionNavigation } from "../../../hooks/useLessons";

interface LessonPageProps {
  params: {
    id: string;
  };
}

export default function LessonPage({ params }: LessonPageProps) {
  const router = useRouter();
  const { lesson, progress, loading, error, refetch } = useLesson(params.id);
  const {
    currentSection,
    setCurrentSection,
    canNavigateNext,
    canNavigatePrevious,
    goToNextSection,
    goToPreviousSection,
    goToSection,
    completedSections,
    markSectionComplete
  } = useSectionNavigation(lesson, progress);

  const handleQuizComplete = (score: number, answers: number[]) => {
    console.log("Quiz completed:", { score, answers });
    // Mark current section as complete
    markSectionComplete(currentSection);
    
    // Auto-advance to next section if available
    if (canNavigateNext) {
      setTimeout(() => {
        goToNextSection();
      }, 2000);
    }
  };

  const handleSectionChange = (sectionIndex: number) => {
    goToSection(sectionIndex);
  };

  if (loading) {
    return (
      <div className="lesson-loading">
        <div className="loading-spinner"></div>
        <p>Loading lesson...</p>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="lesson-error">
        <h2>❌ {error || 'Lesson not found'}</h2>
        <p>We couldn't load this lesson. Please try again or go back to your lessons.</p>
        <div className="lesson-error__actions">
          <Button onClick={refetch}>Try Again</Button>
          <Button variant="secondary" onClick={() => router.push('/')}>
            Back to Lessons
          </Button>
        </div>
      </div>
    );
  }

  if (!lesson.sections || lesson.sections.length === 0) {
    return (
      <div className="lesson-error">
        <h2>📝 No content available</h2>
        <p>This lesson doesn't have any sections yet.</p>
        <Button onClick={() => router.push('/')}>Back to Lessons</Button>
      </div>
    );
  }

  const currentSectionData = lesson.sections[currentSection];
  if (!currentSectionData) {
    return (
      <div className="lesson-error">
        <h2>📝 Section not found</h2>
        <p>The requested section doesn't exist.</p>
        <Button onClick={() => router.push('/')}>Back to Lessons</Button>
      </div>
    );
  }

  const sectionTitles = lesson.sections.map(section => section.title);

  return (
    <div className="lesson-page">
      <div className="lesson-header">
        <div className="lesson-breadcrumb">
          <Button 
            variant="secondary" 
            size="small"
            onClick={() => router.push('/')}
          >
            ← Back to Lessons
          </Button>
        </div>
        <h1 className="lesson-title">{lesson.title}</h1>
        <div className="lesson-meta">
          <span className="lesson-sections-count">
            {lesson.sections.length} sections
          </span>
          {lesson.videoUrl && (
            <a 
              href={lesson.videoUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="lesson-video-link"
            >
              📺 Original Video
            </a>
          )}
        </div>
      </div>

      <div className="lesson-content">
        <div className="lesson-main">
          <Card className="lesson-section">
            <CardHeader>
              <div className="lesson-section__header">
                <h2 className="lesson-section__title">
                  {currentSectionData.title}
                </h2>
                <div className="lesson-section__progress">
                  Section {currentSection + 1} of {lesson.sections.length}
                </div>
              </div>
              <p className="lesson-section__summary">
                {currentSectionData.summary}
              </p>
            </CardHeader>

            <CardContent>
              <div className="lesson-objectives">
                <h3 className="lesson-objectives__title">Learning Objectives</h3>
                <ul className="lesson-objectives__list">
                  {currentSectionData.learningObjectives.map((objective, index) => (
                    <li key={index} className="lesson-objectives__item">
                      {objective}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lesson-content-body">
                <div 
                  className="lesson-content__text"
                  dangerouslySetInnerHTML={{ 
                    __html: currentSectionData.content.replace(/\n/g, '<br/>') 
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {currentSectionData.quiz && (
            <Card className="lesson-quiz">
              <CardHeader>
                <h3 className="quiz-section-title">Section Quiz</h3>
                <p className="quiz-section-description">
                  Test your understanding of the concepts covered in this section.
                </p>
              </CardHeader>
              <CardContent>
                <Quiz
                  questions={currentSectionData.quiz.questions}
                  onComplete={handleQuizComplete}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lesson-sidebar">
          <SectionNavigation
            currentSection={currentSection}
            totalSections={lesson.sections.length}
            onSectionChange={handleSectionChange}
            onPrevious={canNavigatePrevious ? goToPreviousSection : undefined}
            onNext={canNavigateNext ? goToNextSection : undefined}
            canNavigateNext={canNavigateNext}
            sectionTitles={sectionTitles}
            completedSections={completedSections}
          />
        </div>
      </div>
    </div>
  );
}