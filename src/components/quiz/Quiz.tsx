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
  key?: string | number; // Add key prop to force re-render when section changes
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
  const [checkedAnswers, setCheckedAnswers] = useState<boolean[]>(
    new Array(questions.length).fill(false)
  );

  const handleAnswerSelect = (answerIndex: number) => {
    if (checkedAnswers[currentQuestion]) return;

    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleCheckAnswer = () => {
    const newCheckedAnswers = [...checkedAnswers];
    newCheckedAnswers[currentQuestion] = true;
    setCheckedAnswers(newCheckedAnswers);
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
    setCheckedAnswers(new Array(questions.length).fill(false));
    setCurrentQuestion(0);
    setShowResults(false);
    setSubmitted(false);
  };

  const isAnswered = selectedAnswers[currentQuestion] !== -1;
  const isChecked = checkedAnswers[currentQuestion];
  const allAnswered = selectedAnswers.every((answer) => answer !== -1);
  const allChecked = checkedAnswers.every((checked) => checked);
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
                const isIncorrect = isChecked && isSelected && !isCorrect;
                const shouldShowCorrect = isChecked && isCorrect;

                return (
                  <button
                    key={index}
                    className={`quiz__option ${
                      isSelected ? "quiz__option--selected" : ""
                    } ${isIncorrect ? "quiz__option--incorrect" : ""} ${
                      shouldShowCorrect ? "quiz__option--correct" : ""
                    }`}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={isChecked}
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

            {isChecked && currentQuestionData.explanation && (
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

                {!isChecked ? (
                  <Button onClick={handleCheckAnswer} disabled={!isAnswered}>
                    Check Answer
                  </Button>
                ) : currentQuestion < questions.length - 1 ? (
                  <Button onClick={handleNext}>
                    Next Question
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!allChecked || submitted}
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
