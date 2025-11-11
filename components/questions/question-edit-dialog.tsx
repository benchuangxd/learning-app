'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { Question, QuestionChoice } from '@/types/question';
import { X, Plus } from 'lucide-react';

interface QuestionEditDialogProps {
  question: Question;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedQuestion: Question) => void;
}

export function QuestionEditDialog({
  question,
  open,
  onOpenChange,
  onSave,
}: QuestionEditDialogProps): React.ReactElement {
  const [questionText, setQuestionText] = useState<string>(question.text);
  const [explanation, setExplanation] = useState<string>(question.explanation);
  const [points, setPoints] = useState<number>(question.points);
  const [choices, setChoices] = useState<QuestionChoice[]>(question.choices);
  const [errors, setErrors] = useState<string[]>([]);

  // Reset form when question changes
  useEffect(() => {
    setQuestionText(question.text);
    setExplanation(question.explanation);
    setPoints(question.points);
    setChoices(question.choices);
    setErrors([]);
  }, [question]);

  const handleChoiceTextChange = (index: number, text: string): void => {
    const newChoices = [...choices];
    const choice = newChoices[index];
    if (choice) {
      newChoices[index] = { ...choice, text };
      setChoices(newChoices);
    }
  };

  const handleToggleCorrect = (index: number): void => {
    const newChoices = [...choices];
    const choice = newChoices[index];
    if (choice) {
      newChoices[index] = { ...choice, isCorrect: !choice.isCorrect };
      setChoices(newChoices);
    }
  };

  const handleAddChoice = (): void => {
    if (choices.length >= 6) {
      setErrors(['Maximum 6 choices allowed']);
      return;
    }

    const nextLabel = String.fromCharCode(65 + choices.length); // A, B, C...
    const newChoice: QuestionChoice = {
      id: crypto.randomUUID(),
      label: nextLabel,
      text: '',
      isCorrect: false,
    };
    setChoices([...choices, newChoice]);
    setErrors([]);
  };

  const handleRemoveChoice = (index: number): void => {
    if (choices.length <= 2) {
      setErrors(['Minimum 2 choices required']);
      return;
    }

    const newChoices = choices.filter((_, i) => i !== index);
    
    // Re-label remaining choices
    const relabeledChoices = newChoices.map((choice, i) => ({
      ...choice,
      label: String.fromCharCode(65 + i),
    }));

    setChoices(relabeledChoices);
    setErrors([]);
  };

  const validate = (): boolean => {
    const newErrors: string[] = [];

    if (!questionText.trim()) {
      newErrors.push('Question text is required');
    }

    if (choices.length < 2) {
      newErrors.push('At least 2 choices required');
    }

    const correctChoices = choices.filter((c) => c.isCorrect);
    if (correctChoices.length === 0) {
      newErrors.push('At least one correct answer required');
    }

    const emptyChoices = choices.filter((c) => !c.text.trim());
    if (emptyChoices.length > 0) {
      newErrors.push('All choices must have text');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = (): void => {
    if (!validate()) {
      return;
    }

    const updatedQuestion: Question = {
      ...question,
      text: questionText.trim(),
      explanation: explanation.trim(),
      points,
      choices,
      updatedAt: new Date(),
    };

    onSave(updatedQuestion);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Question</DialogTitle>
          <DialogDescription>
            Make changes to your question. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">
                Please fix the following:
              </p>
              <ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside">
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Question Text */}
          <div className="space-y-2">
            <Label htmlFor="question-text">Question Text</Label>
            <Textarea
              id="question-text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter your question..."
              rows={3}
            />
          </div>

          {/* Points */}
          <div className="space-y-2">
            <Label htmlFor="points">Points</Label>
            <Input
              id="points"
              type="number"
              min={1}
              max={10}
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value) || 1)}
              className="w-32"
            />
          </div>

          {/* Choices */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Answer Choices</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddChoice}
                disabled={choices.length >= 6}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Choice
              </Button>
            </div>

            <div className="space-y-2">
              {choices.map((choice, index) => (
                <div key={choice.id} className="flex items-start gap-2">
                  <div className="flex items-center gap-2 pt-2">
                    <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                      {choice.label}
                    </Badge>
                    <input
                      type="checkbox"
                      checked={choice.isCorrect}
                      onChange={() => handleToggleCorrect(index)}
                      className="h-4 w-4 rounded"
                      title="Mark as correct"
                    />
                  </div>
                  <Input
                    value={choice.text}
                    onChange={(e) => handleChoiceTextChange(index, e.target.value)}
                    placeholder={`Choice ${choice.label} text...`}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveChoice(index)}
                    disabled={choices.length <= 2}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Check the box to mark choice(s) as correct. Multiple correct answers are supported.
            </p>
          </div>

          {/* Explanation */}
          <div className="space-y-2">
            <Label htmlFor="explanation">Explanation (supports markdown)</Label>
            <Textarea
              id="explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Enter explanation (use **bold** for emphasis)..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
