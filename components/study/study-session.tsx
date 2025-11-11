'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Question } from '@/types/question';
import { CheckCircle2, XCircle, BookOpen, Trophy } from 'lucide-react';
import Link from 'next/link';
import { updateReviewMetadata } from '@/lib/services/review-service';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface StudySessionProps {
  questions: Question[];
}

interface QuestionResult {
  questionId: string;
  selectedChoiceIds: string[];
  isCorrect: boolean;
  timestamp: Date;
}

export function StudySession({ questions }: StudySessionProps): React.ReactElement {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedChoices, setSelectedChoices] = useState<Set<string>>(new Set());
  const [answered, setAnswered] = useState<boolean>(false);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  const currentQuestion = questions[currentIndex];
  const isComplete = currentIndex >= questions.length;
  const progress = ((currentIndex + (answered ? 1 : 0)) / questions.length) * 100;

  // Reset when questions change
  useEffect(() => {
    setCurrentIndex(0);
    setSelectedChoices(new Set());
    setAnswered(false);
    setResults([]);
    setShowExplanation(false);
  }, [questions]);

  if (!currentQuestion || isComplete) {
    // Show summary
    const score = results.filter((r) => r.isCorrect).length;
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <Trophy className="h-16 w-16 text-yellow-500" />
          </div>
          <CardTitle className="text-center text-2xl">Session Complete!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-4xl font-bold">{percentage}%</p>
            <p className="text-muted-foreground">
              {score} out of {questions.length} correct
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Correct: {score}</span>
              <span>Incorrect: {questions.length - score}</span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>

          <div className="flex gap-2 justify-center">
            <Link href="/questions">
              <Button variant="outline">Manage Questions</Button>
            </Link>
            <Button onClick={() => window.location.reload()}>Study Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const correctChoices = currentQuestion.choices.filter((c) => c.isCorrect);
  const isMultipleAnswer = correctChoices.length > 1;

  const handleChoiceSelect = (choiceId: string): void => {
    if (answered) return;

    if (isMultipleAnswer) {
      // Toggle for multiple answer
      const newSelected = new Set(selectedChoices);
      if (newSelected.has(choiceId)) {
        newSelected.delete(choiceId);
      } else {
        newSelected.add(choiceId);
      }
      setSelectedChoices(newSelected);
    } else {
      // Replace for single answer
      setSelectedChoices(new Set([choiceId]));
    }
  };

  const handleSubmit = (): void => {
    if (selectedChoices.size === 0) return;

    // Check if answer is correct
    const correctIds = new Set(correctChoices.map((c) => c.id));
    const isCorrect =
      selectedChoices.size === correctIds.size &&
      Array.from(selectedChoices).every((id) => correctIds.has(id));

    // Record result
    const result: QuestionResult = {
      questionId: currentQuestion.id,
      selectedChoiceIds: Array.from(selectedChoices),
      isCorrect,
      timestamp: new Date(),
    };

    setResults([...results, result]);
    setAnswered(true);
    setShowExplanation(true);

    // Update spaced repetition metadata
    updateReviewMetadata(currentQuestion.id, isCorrect);
  };

  const handleNext = (): void => {
    setCurrentIndex(currentIndex + 1);
    setSelectedChoices(new Set());
    setAnswered(false);
    setShowExplanation(false);
  };

  const isAnswerCorrect = (): boolean => {
    const correctIds = new Set(correctChoices.map((c) => c.id));
    return (
      selectedChoices.size === correctIds.size &&
      Array.from(selectedChoices).every((id) => correctIds.has(id))
    );
  };

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-lg">{currentQuestion.text}</CardTitle>
            <div className="flex gap-2 shrink-0">
              <Badge variant="outline">{currentQuestion.points} pt</Badge>
              {isMultipleAnswer && (
                <Badge variant="secondary" className="bg-purple-500 text-white">
                  Select {correctChoices.length}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Choices */}
          <div className="space-y-3">
            {currentQuestion.choices.map((choice) => {
              const isSelected = selectedChoices.has(choice.id);
              const showCorrectness = answered;
              const isCorrectChoice = choice.isCorrect;

              return (
                <div
                  key={choice.id}
                  onClick={() => handleChoiceSelect(choice.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    showCorrectness && isCorrectChoice
                      ? 'border-green-500 bg-green-50 dark:bg-green-950'
                      : showCorrectness && isSelected && !isCorrectChoice
                        ? 'border-red-500 bg-red-50 dark:bg-red-950'
                        : isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                  } ${answered ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">
                      {isMultipleAnswer ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="h-4 w-4 rounded border-gray-300"
                          disabled={answered}
                        />
                      ) : (
                        <input
                          type="radio"
                          checked={isSelected}
                          onChange={() => {}}
                          className="h-4 w-4"
                          disabled={answered}
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold">{choice.label}.</span> {choice.text}
                    </div>
                    {showCorrectness && isCorrectChoice && (
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                    )}
                    {showCorrectness && isSelected && !isCorrectChoice && (
                      <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Feedback */}
          {answered && (
            <Alert
              className={
                isAnswerCorrect()
                  ? 'border-green-500 bg-green-50 dark:bg-green-950'
                  : 'border-red-500 bg-red-50 dark:bg-red-950'
              }
            >
              {isAnswerCorrect() ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertTitle className={isAnswerCorrect() ? 'text-green-600' : 'text-red-600'}>
                {isAnswerCorrect() ? 'Correct!' : 'Incorrect'}
              </AlertTitle>
              <AlertDescription className={isAnswerCorrect() ? 'text-green-600' : 'text-red-600'}>
                {isAnswerCorrect()
                  ? `Great job! You earned ${currentQuestion.points} point${currentQuestion.points !== 1 ? 's' : ''}.`
                  : `The correct answer${correctChoices.length > 1 ? 's are' : ' is'}: ${correctChoices.map((c) => c.label).join(', ')}`}
              </AlertDescription>
            </Alert>
          )}

          {/* Explanation */}
          {showExplanation && currentQuestion.explanation && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-start gap-2">
                <BookOpen className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold mb-1">Explanation:</p>
                  <div className="text-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {currentQuestion.explanation}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            {!answered ? (
              <Button onClick={handleSubmit} disabled={selectedChoices.size === 0}>
                Submit Answer
              </Button>
            ) : (
              <Button onClick={handleNext}>
                {currentIndex < questions.length - 1 ? 'Next Question' : 'View Results'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
