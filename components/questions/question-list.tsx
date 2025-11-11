'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LocalStorageAdapter, STORAGE_KEYS } from '@/lib/storage/local-storage';
import type { Question } from '@/types/question';
import { Trash2, BookOpen, AlertCircle, Edit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { QuestionEditDialog } from './question-edit-dialog';

const questionsStorage = new LocalStorageAdapter<Question[]>(STORAGE_KEYS.QUESTIONS);

export function QuestionList(): React.ReactElement {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const loadQuestions = (): void => {
    const stored = questionsStorage.get();
    setQuestions(stored ?? []);
  };

  useEffect(() => {
    loadQuestions();

    // Listen for storage changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent): void => {
      if (e.key === STORAGE_KEYS.QUESTIONS) {
        loadQuestions();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleDelete = (id: string): void => {
    const updated = questions.filter((q) => q.id !== id);
    questionsStorage.set(updated);
    setQuestions(updated);
    if (expandedId === id) {
      setExpandedId(null);
    }
  };

  const handleClearAll = (): void => {
    if (window.confirm('Are you sure you want to delete all questions? This cannot be undone.')) {
      questionsStorage.set([]);
      setQuestions([]);
      setExpandedId(null);
    }
  };

  const handleEdit = (question: Question): void => {
    setEditingQuestion(question);
  };

  const handleSaveEdit = (updatedQuestion: Question): void => {
    const updated = questions.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q));
    questionsStorage.set(updated);
    setQuestions(updated);
    window.dispatchEvent(new Event('storage'));
    setEditingQuestion(null);
  };

  const toggleExpanded = (id: string): void => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (questions.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No questions yet. Import some questions above to get started!
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Your Questions</h2>
          <p className="text-sm text-muted-foreground">
            {questions.length} question{questions.length !== 1 ? 's' : ''} in your library
          </p>
        </div>
        <Button variant="destructive" size="sm" onClick={handleClearAll}>
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All
        </Button>
      </div>

      <div className="space-y-3">
        {questions.map((question, idx) => {
          const isExpanded = expandedId === question.id;
          const correctChoices = question.choices.filter((c) => c.isCorrect);
          const isMultipleAnswer = correctChoices.length > 1;

          return (
            <Card key={question.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <CardTitle className="text-base">Question {idx + 1}</CardTitle>
                      <Badge variant="secondary">{question.points} point(s)</Badge>
                      <Badge variant="outline">{question.difficulty}</Badge>
                      {isMultipleAnswer && (
                        <Badge variant="default" className="bg-purple-500">
                          Multiple Answers
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{question.text}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(question)}
                      aria-label="Edit question"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(question.id)}
                      aria-label="Delete question"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Choices */}
                  <div className="space-y-2">
                    {question.choices.map((choice) => (
                      <div
                        key={choice.id}
                        className={`text-sm p-2 rounded-md ${
                          choice.isCorrect
                            ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 font-medium'
                            : 'bg-muted'
                        }`}
                      >
                        <span className="font-semibold">{choice.label}.</span> {choice.text}
                        {choice.isCorrect && ' ✅'}
                      </div>
                    ))}
                  </div>

                  {/* Explanation Toggle */}
                  {question.explanation && (
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(question.id)}
                        className="w-full justify-start"
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        {isExpanded ? 'Hide' : 'Show'} Explanation
                      </Button>
                      {isExpanded && (
                        <div className="mt-2 p-3 bg-muted rounded-md text-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {question.explanation}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Correct answer{correctChoices.length > 1 ? 's' : ''}:{' '}
                    <span className="font-medium">
                      {correctChoices.map((c) => c.label).join(', ')}
                    </span>{' '}
                    • Created: {new Date(question.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      {editingQuestion && (
        <QuestionEditDialog
          question={editingQuestion}
          open={editingQuestion !== null}
          onOpenChange={(open) => !open && setEditingQuestion(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
