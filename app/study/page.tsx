'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StudySession } from '@/components/study/study-session';
import { LocalStorageAdapter, STORAGE_KEYS } from '@/lib/storage/local-storage';
import type { Question } from '@/types/question';
import { BookOpen, AlertCircle, Shuffle, Calendar } from 'lucide-react';
import { getDueQuestions, getReviewStats } from '@/lib/services/review-service';

const questionsStorage = new LocalStorageAdapter<Question[]>(STORAGE_KEYS.QUESTIONS);

export default function StudyPage(): React.ReactElement {
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [sessionStarted, setSessionStarted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const stored = questionsStorage.get();
    setAllQuestions(stored ?? []);
    setLoading(false);
  }, []);

  const stats = getReviewStats(allQuestions);

  const handleStartSession = (mode: 'all' | 'due' | 'random'): void => {
    let questionsToStudy: Question[];

    if (mode === 'due') {
      questionsToStudy = getDueQuestions(allQuestions);
    } else if (mode === 'random') {
      // Fisher-Yates shuffle
      questionsToStudy = [...allQuestions];
      for (let i = questionsToStudy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questionsToStudy[i], questionsToStudy[j]] = [questionsToStudy[j]!, questionsToStudy[i]!];
      }
    } else {
      questionsToStudy = [...allQuestions];
    }

    // Randomize answer choices for each question
    const questionsWithShuffledChoices = questionsToStudy.map((question) => {
      const shuffledChoices = [...question.choices];
      
      // Fisher-Yates shuffle for choices
      for (let i = shuffledChoices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledChoices[i], shuffledChoices[j]] = [shuffledChoices[j]!, shuffledChoices[i]!];
      }

      // Re-assign labels (A, B, C, D) based on new positions
      const relabeledChoices = shuffledChoices.map((choice, index) => ({
        ...choice,
        label: String.fromCharCode(65 + index), // A=65, B=66, C=67, D=68
      }));

      return {
        ...question,
        choices: relabeledChoices,
      };
    });

    setSessionQuestions(questionsWithShuffledChoices);
    setSessionStarted(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (sessionStarted && sessionQuestions.length > 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Study Session</h1>
          </div>

          <StudySession questions={sessionQuestions} />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Study Session</h1>
          <p className="text-muted-foreground">Test your knowledge with practice questions</p>
        </div>

        {allQuestions.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">No questions available</p>
              <p className="text-sm">
                You need to import some questions before starting a study session.
              </p>
              <Link href="/questions">
                <Button variant="link" className="px-0 h-auto mt-2">
                  Go to Questions →
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Ready to Study</CardTitle>
                <CardDescription>
                  You have {allQuestions.length} question{allQuestions.length !== 1 ? 's' : ''} in
                  your library
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                  <div className="p-4 bg-blue-100 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-400">New</p>
                    <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                      {stats.new}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-100 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
                    <p className="text-sm text-orange-700 dark:text-orange-400">Learning</p>
                    <p className="text-3xl font-bold text-orange-700 dark:text-orange-400">
                      {stats.learning}
                    </p>
                  </div>
                  <div className="p-4 bg-green-100 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-700 dark:text-green-400">Review</p>
                    <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                      {stats.review}
                    </p>
                  </div>
                  <div className="p-4 bg-red-100 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-700 dark:text-red-400">Due Today</p>
                    <p className="text-3xl font-bold text-red-700 dark:text-red-400">
                      {stats.due}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Start Session Options */}
            <Card>
              <CardHeader>
                <CardTitle>Choose Study Mode</CardTitle>
                <CardDescription>
                  Select how you&apos;d like to practice your questions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => handleStartSession('due')}
                  className="w-full justify-start h-auto py-4 text-left"
                  disabled={stats.due === 0}
                >
                  <div className="flex items-center gap-3 w-full">
                    <Calendar className="h-5 w-5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-primary-foreground">Review Due ({stats.due})</p>
                      <p className="text-sm font-normal text-primary-foreground/80">
                        Study questions that are due for review today
                      </p>
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => handleStartSession('all')}
                  variant="outline"
                  className="w-full justify-start h-auto py-4 text-left"
                >
                  <div className="flex items-center gap-3 w-full">
                    <BookOpen className="h-5 w-5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">All Questions</p>
                      <p className="text-sm font-normal text-muted-foreground">
                        Practice all questions in original order
                      </p>
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => handleStartSession('random')}
                  variant="outline"
                  className="w-full justify-start h-auto py-4 text-left"
                >
                  <div className="flex items-center gap-3 w-full">
                    <Shuffle className="h-5 w-5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">Random Order</p>
                      <p className="text-sm font-normal text-muted-foreground">
                        Shuffle all questions for varied practice
                      </p>
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
