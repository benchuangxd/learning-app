'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Library, BarChart3, ArrowRight, TrendingUp } from 'lucide-react';
import { LocalStorageAdapter, STORAGE_KEYS } from '@/lib/storage/local-storage';
import type { Question } from '@/types/question';
import { getReviewStats } from '@/lib/services/review-service';

const questionsStorage = new LocalStorageAdapter<Question[]>(STORAGE_KEYS.QUESTIONS);

export default function Home(): React.ReactElement {
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    const stored = questionsStorage.get();
    setQuestions(stored ?? []);
  }, []);

  const stats = getReviewStats(questions);

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Welcome to Learning App</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Master your knowledge with spaced repetition
          </p>

          {/* Quick Stats */}
          {questions.length > 0 && (
            <div className="flex justify-center gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Questions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-500">{stats.due}</div>
                <div className="text-sm text-muted-foreground">Due Today</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500">{stats.review}</div>
                <div className="text-sm text-muted-foreground">Mastered</div>
              </div>
            </div>
          )}

          {stats.due > 0 && (
            <Link href="/study">
              <Button size="lg" className="gap-2">
                <BookOpen className="h-5 w-5" />
                Review {stats.due} Question{stats.due !== 1 ? 's' : ''}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>

        {/* Feature Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Link href="/questions">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Library className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-center">Manage Questions</CardTitle>
                <CardDescription className="text-center">
                  Import and organize your study questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  View Questions
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/study">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-center">Study Now</CardTitle>
                <CardDescription className="text-center">
                  Practice with your imported questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Start Studying</Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/statistics">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <BarChart3 className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-center">View Progress</CardTitle>
                <CardDescription className="text-center">
                  Track your learning statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  View Statistics
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Info */}
        <div className="mt-12 p-6 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">How it works</h2>
          </div>
          <ol className="space-y-2 text-muted-foreground">
            <li>1. Import your questions in markdown format</li>
            <li>2. Start a study session and answer questions</li>
            <li>3. Review due questions daily for optimal retention</li>
            <li>4. Track your progress and see improvements</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
