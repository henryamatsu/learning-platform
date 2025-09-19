"use client";

import React, { useState } from "react";
import { Button } from "../ui/Button";
import { Card, CardHeader, CardContent, CardFooter } from "../ui/Card";
import "./Quiz.css";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizProps {
  questions: QuizQuestion[];
  onComplete?: (score: number, answers: number[]) => void;
  className?: string;
}

export const Quiz: React.FC<QuizProps> = ({
  questions,
  onComplete,
  className = "",
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(
    new Array(questions.length).fill(-1)
  );
  const [showResults, setShowResults] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleAnswerSelect = (answerIndex: number) => {
    if (submitted) return;

    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setShowResults(true);

    const score = selectedAnswers.reduce((acc, answer, index) => {
      return acc + (answer === questions[index].correctAnswer ? 1 : 0);
    }, 0);

    onComplete?.(score, selectedAnswers);
  };

  const handleRetake = () => {
    setSelectedAnswers(new Array(questions.length).fill(-1));
    setCurrentQuestion(0);
    setShowResults(false);
    setSubmitted(false);
  };

  const isAnswered = selectedAnswers[currentQuestion] !== -1;
  const allAnswered = selectedAnswers.every((answer) => answer !== -1);
  const currentQuestionData = questions[currentQuestion];
  const score = selectedAnswers.reduce((acc, answer, index) => {
    return acc + (answer === questions[index].correctAnswer ? 1 : 0);
  }, 0);

  return (
    <div className={`quiz ${className}`}>
      <Card>
        <CardHeader>
          <div className="quiz__header">
            <h3 className="quiz__title">
              Question {currentQuestion + 1} of {questions.length}
            </h3>
            <div className="quiz__progress">
              <div
                className="quiz__progress-bar"
                style={{
                  width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="quiz__question">
            <h4 className="quiz__question-text">
              {currentQuestionData.question}
            </h4>

            <div className="quiz__options">
              {currentQuestionData.options.map((option, index) => {
                const isSelected = selectedAnswers[currentQuestion] === index;
                const isCorrect = index === currentQuestionData.correctAnswer;
                const isIncorrect = submitted && isSelected && !isCorrect;
                const shouldShowCorrect = submitted && isCorrect;

                return (
                  <button
                    key={index}
                    className={`quiz__option ${
                      isSelected ? "quiz__option--selected" : ""
                    } ${isIncorrect ? "quiz__option--incorrect" : ""} ${
                      shouldShowCorrect ? "quiz__option--correct" : ""
                    }`}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={submitted}
                  >
                    <span className="quiz__option-letter">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="quiz__option-text">{option}</span>
                    {shouldShowCorrect && (
                      <span className="quiz__option-icon">✓</span>
                    )}
                    {isIncorrect && (
                      <span className="quiz__option-icon">✗</span>
                    )}
                  </button>
                );
              })}
            </div>

            {submitted && currentQuestionData.explanation && (
              <div className="quiz__explanation">
                <h5>Explanation:</h5>
                <p>{currentQuestionData.explanation}</p>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter>
          {!showResults ? (
            <div className="quiz__actions">
              <div className="quiz__navigation">
                <Button
                  variant="secondary"
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                >
                  Previous
                </Button>

                {currentQuestion < questions.length - 1 ? (
                  <Button onClick={handleNext} disabled={!isAnswered}>
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!allAnswered || submitted}
                  >
                    Submit Quiz
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="quiz__results">
              <div className="quiz__score">
                <h4>Quiz Complete!</h4>
                <p>
                  You scored {score} out of {questions.length} questions
                  correctly.
                </p>
                <div className="quiz__score-percentage">
                  {Math.round((score / questions.length) * 100)}%
                </div>
              </div>
              <Button onClick={handleRetake} variant="secondary">
                Retake Quiz
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};
