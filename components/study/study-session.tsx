'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Question, QuestionChoice } from '@/types/question';
import { CheckCircle2, XCircle, BookOpen, Trophy } from 'lucide-react';
import Link from 'next/link';
import { updateReviewMetadata } from '@/lib/services/review-service';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SortableList } from './sortable-list';

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
  const [sortedChoices, setSortedChoices] = useState<QuestionChoice[]>([]);
  const [shortAnswer, setShortAnswer] = useState<string>('');

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
    setSortedChoices([]);
    setShortAnswer('');
  }, [questions]);

  // Initialize sorted choices when question changes
  useEffect(() => {
    if (currentQuestion) {
      setSortedChoices(currentQuestion.choices);
    }
  }, [currentQuestion]);

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
    // Check if this is a sorting question (has correctOrder field)
    const isSortingQuestion = currentQuestion.choices.some((c) => c.correctOrder !== undefined);
    
    // Check if this is a fill-in-the-blank question (has ___ and single correct choice)
    const isFillInBlank = currentQuestion.text.includes('___') &&
                          currentQuestion.choices.length === 1 &&
                          correctChoices.length === 1;
    
    // For non-sorting/fill-in-blank questions, require selection
    if (!isSortingQuestion && !isFillInBlank && selectedChoices.size === 0) return;
    
    // For fill-in-blank, require answer input
    if (isFillInBlank && !shortAnswer.trim()) return;

    let isCorrect: boolean;
    
    if (isSortingQuestion) {
      // Check if all items are in correct order (strict ordering)
      isCorrect = sortedChoices.every((choice, index) => {
        return choice.correctOrder === index + 1;
      });
    } else if (isFillInBlank) {
      // Check if short answer matches the correct answer
      const correctAnswer = correctChoices[0]?.text ?? '';
      isCorrect = normalizeAnswer(shortAnswer) === normalizeAnswer(correctAnswer);
    } else {
      // Check if answer is correct for normal questions
      const correctIds = new Set(correctChoices.map((c) => c.id));
      isCorrect =
        selectedChoices.size === correctIds.size &&
        Array.from(selectedChoices).every((id) => correctIds.has(id));
    }

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

  const normalizeAnswer = (answer: string): string => {
    // Normalize answer for comparison:
    // - Remove commas, spaces, and common separators
    // - Convert to lowercase
    // - Trim whitespace
    return answer
      .toLowerCase()
      .replace(/[,\s_-]/g, '')
      .trim();
  };

  const handleNext = (): void => {
    setCurrentIndex(currentIndex + 1);
    setSelectedChoices(new Set());
    setAnswered(false);
    setShowExplanation(false);
    setSortedChoices([]);
    setShortAnswer('');
  };

  const isAnswerCorrect = (): boolean => {
    // Check if this is a sorting question
    const isSortingQuestion = currentQuestion.choices.some((c) => c.correctOrder !== undefined);
    
    // Check if this is a fill-in-the-blank question
    const isFillInBlank = currentQuestion.text.includes('___') &&
                          currentQuestion.choices.length === 1 &&
                          correctChoices.length === 1;
    
    if (isSortingQuestion) {
      // Check if all items are in correct order
      return sortedChoices.every((choice, index) => {
        return choice.correctOrder === index + 1;
      });
    }
    
    if (isFillInBlank) {
      // Check if short answer matches the correct answer
      const correctAnswer = correctChoices[0]?.text ?? '';
      return normalizeAnswer(shortAnswer) === normalizeAnswer(correctAnswer);
    }
    
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
          {/* Sorting Question - Draggable List */}
          {currentQuestion.choices.some((c) => c.correctOrder !== undefined) ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {answered ? '✨ Drag items to reorder (disabled)' : '✨ Drag items to reorder them correctly'}
              </div>
              <SortableList
                choices={sortedChoices}
                onOrderChange={(newOrder) => setSortedChoices(newOrder)}
                disabled={answered}
              />
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
                      : 'The correct order is shown below.'}
                  </AlertDescription>
                </Alert>
              )}
              {answered && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">
                    Correct Order:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700 dark:text-blue-400">
                    {currentQuestion.choices
                      .sort((a, b) => (a.correctOrder ?? 0) - (b.correctOrder ?? 0))
                      .map((choice) => (
                        <li key={choice.id}>{choice.text}</li>
                      ))}
                  </ol>
                </div>
              )}
            </div>
          ) : currentQuestion.text.includes('___') && currentQuestion.choices.length === 1 ? (
            /* Fill-in-the-Blank with Short Answer Input */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="short-answer">Your Answer:</Label>
                <Input
                  id="short-answer"
                  type="text"
                  value={shortAnswer}
                  onChange={(e) => setShortAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  disabled={answered}
                  className="text-lg"
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Enter your answer (numbers, text, etc.)
                </p>
              </div>
              
              {answered && (
                <div className={`p-4 rounded-lg border-2 ${
                  isAnswerCorrect()
                    ? 'border-green-500 bg-green-50 dark:bg-green-950'
                    : 'border-red-500 bg-red-50 dark:bg-red-950'
                }`}>
                  <div className="flex items-start gap-3">
                    {isAnswerCorrect() ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={`font-semibold mb-1 ${
                        isAnswerCorrect() ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isAnswerCorrect() ? 'Correct!' : 'Incorrect'}
                      </p>
                      <p className={`text-sm ${
                        isAnswerCorrect() ? 'text-green-600' : 'text-red-600'
                      }`}>
                        Your answer: <span className="font-semibold">{shortAnswer}</span>
                      </p>
                      {!isAnswerCorrect() && (
                        <p className="text-sm text-red-600 mt-1">
                          Correct answer: <span className="font-semibold">{correctChoices[0]?.text}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Regular Multiple Choice */
            <div className="space-y-3">
              {currentQuestion.choices.map((choice) => {
                const isSelected = selectedChoices.has(choice.id);
                const showCorrectness = answered;
                const isCorrectChoice = choice.isCorrect;

                return (
                  <div
                    key={choice.id}
                    onClick={() => handleChoiceSelect(choice.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      showCorrectness && isCorrectChoice
                        ? 'border-green-500 bg-green-50 dark:bg-green-950 cursor-default'
                        : showCorrectness && isSelected && !isCorrectChoice
                          ? 'border-red-500 bg-red-50 dark:bg-red-950 cursor-default'
                          : isSelected
                            ? 'border-primary bg-primary/5 cursor-pointer'
                            : 'border-border hover:border-primary/50 cursor-pointer'
                    } ${answered ? 'cursor-default' : ''}`}
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
                        <span className="font-semibold">{choice.label}.</span>
                        <span> {choice.text}</span>
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
          )}

          {/* Feedback */}
          {answered && !currentQuestion.choices.some((c) => c.correctOrder !== undefined) && (
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
              <Button
                onClick={handleSubmit}
                disabled={
                  currentQuestion.text.includes('___') && currentQuestion.choices.length === 1
                    ? !shortAnswer.trim()
                    : !currentQuestion.choices.some((c) => c.correctOrder !== undefined) &&
                      currentQuestion.choices.length > 1 &&
                      correctChoices.length > 0 &&
                      selectedChoices.size === 0
                }
              >
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
