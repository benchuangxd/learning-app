'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LocalStorageAdapter, STORAGE_KEYS } from '@/lib/storage/local-storage';
import type { Question } from '@/types/question';
import { getReviewStats, getReviewMetadata } from '@/lib/services/review-service';
import { StatisticsExportImport } from '@/components/statistics/statistics-export-import';
import { BookOpen, CheckCircle2, Clock, TrendingUp, Calendar, Target } from 'lucide-react';

const questionsStorage = new LocalStorageAdapter<Question[]>(STORAGE_KEYS.QUESTIONS);

export default function StatisticsPage(): React.ReactElement {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const stored = questionsStorage.get();
    setQuestions(stored ?? []);
    setLoading(false);
  }, [refreshKey]);

  const handleImportComplete = (): void => {
    // Trigger re-render to show updated statistics
    setRefreshKey(prev => prev + 1);
  };

  // Get unique categories
  const categories = Array.from(new Set(questions.map(q => q.category).filter(Boolean) as string[])).sort();
  
  // Filter questions by selected category
  const filteredQuestions = selectedCategory === 'all' 
    ? questions 
    : questions.filter(q => q.category === selectedCategory);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const stats = getReviewStats(filteredQuestions);

  // Calculate mastery percentage
  const masteryPercentage = filteredQuestions.length > 0 
    ? Math.round((stats.review / filteredQuestions.length) * 100) 
    : 0;

  // Get questions by review status
  const questionsByStatus = filteredQuestions.map((q) => ({
    question: q,
    metadata: getReviewMetadata(q.id),
  }));

  // Sort by next review date (soonest first)
  const upcomingReviews = questionsByStatus
    .filter((item) => item.metadata.lastReviewed)
    .sort((a, b) => a.metadata.nextReviewDate.getTime() - b.metadata.nextReviewDate.getTime())
    .slice(0, 10);

  // Calculate total points
  const totalPoints = filteredQuestions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Statistics</h1>
          <p className="text-muted-foreground">
            Track your learning progress and performance
            {selectedCategory !== 'all' && ` • Category: ${selectedCategory}`}
          </p>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Filter by Category</CardTitle>
              <CardDescription>View statistics for specific categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                >
                  All ({questions.length})
                </Button>
                {categories.map((category) => {
                  const count = questions.filter(q => q.category === category).length;
                  return (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category} ({count})
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">{totalPoints} total points</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Due Today</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.due}</div>
              <p className="text-xs text-muted-foreground">
                {stats.due === 0 ? 'All caught up!' : 'Ready to review'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Review</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.review}</div>
              <p className="text-xs text-muted-foreground">{masteryPercentage}% of library</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Learning</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.learning}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Overview</CardTitle>
            <CardDescription>Your learning progress across all questions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* New Questions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="font-medium">New</span>
                </div>
                <span className="text-muted-foreground">
                  {stats.new} questions ({Math.round((stats.new / stats.total) * 100)}%)
                </span>
              </div>
              <Progress value={(stats.new / stats.total) * 100} className="h-2" />
            </div>

            {/* Learning Questions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-orange-500" />
                  <span className="font-medium">Learning</span>
                </div>
                <span className="text-muted-foreground">
                  {stats.learning} questions ({Math.round((stats.learning / stats.total) * 100)}%)
                </span>
              </div>
              <Progress value={(stats.learning / stats.total) * 100} className="h-2" />
            </div>

            {/* Review Questions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="font-medium">Review</span>
                </div>
                <span className="text-muted-foreground">
                  {stats.review} questions ({masteryPercentage}%)
                </span>
              </div>
              <Progress value={masteryPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Statistics Export/Import */}
        <StatisticsExportImport onImportComplete={handleImportComplete} />

        {/* Upcoming Reviews */}
        {upcomingReviews.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <CardTitle>Upcoming Reviews</CardTitle>
              </div>
              <CardDescription>Next 10 questions scheduled for review</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingReviews.map((item) => {
                  const daysUntil = Math.ceil(
                    (item.metadata.nextReviewDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  const isOverdue = daysUntil < 0;
                  const isDueToday = daysUntil === 0;

                  return (
                    <div
                      key={item.question.id}
                      className="flex items-start justify-between gap-4 rounded-lg border p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.question.text}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {item.question.points} pt
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Repetitions: {item.metadata.repetitions}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        {isOverdue ? (
                          <Badge variant="destructive" className="gap-1">
                            <Target className="h-3 w-3" />
                            Overdue
                          </Badge>
                        ) : isDueToday ? (
                          <Badge className="gap-1 bg-orange-500">
                            <Clock className="h-3 w-3" />
                            Today
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <Calendar className="h-3 w-3" />
                            {daysUntil}d
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {questions.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Questions Yet</h3>
              <p className="text-muted-foreground mb-4">
                Import some questions to start tracking your progress
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
