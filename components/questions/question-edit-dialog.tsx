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
  const [questionType, setQuestionType] = useState<'regular' | 'sorting' | 'fillInBlank'>(
    question.choices.some((c) => c.correctOrder !== undefined)
      ? 'sorting'
      : question.text.includes('___') && question.choices.length === 1
        ? 'fillInBlank'
        : 'regular'
  );

  // Reset form when question changes
  useEffect(() => {
    setQuestionText(question.text);
    setExplanation(question.explanation);
    setPoints(question.points);
    setChoices(question.choices);
    setErrors([]);
    setQuestionType(
      question.choices.some((c) => c.correctOrder !== undefined)
        ? 'sorting'
        : question.text.includes('___') && question.choices.length === 1
          ? 'fillInBlank'
          : 'regular'
    );
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

  const handleCorrectOrderChange = (index: number, order: number): void => {
    const newChoices = [...choices];
    const choice = newChoices[index];
    if (choice) {
      newChoices[index] = { ...choice, correctOrder: order };
      setChoices(newChoices);
    }
  };

  const handleChangeQuestionType = (newType: 'regular' | 'sorting' | 'fillInBlank'): void => {
    if (newType === questionType) return;

    setQuestionType(newType);

    if (newType === 'sorting') {
      // Converting to sorting: add correctOrder, remove isCorrect
      const newChoices = choices.map((choice, index) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { correctOrder, ...rest } = choice;
        return {
          ...rest,
          correctOrder: index + 1,
          isCorrect: false,
        };
      });
      setChoices(newChoices);
    } else if (newType === 'fillInBlank') {
      // Converting to fill-in-blank: keep only first choice, mark as correct, remove correctOrder
      const firstChoice = choices[0];
      if (firstChoice) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { correctOrder, ...rest } = firstChoice;
        setChoices([{ ...rest, isCorrect: true }]);
      }
      // Add ___ to question text if not present
      if (!questionText.includes('___')) {
        setQuestionText(questionText + ' ___');
      }
    } else {
      // Converting to regular: remove correctOrder, keep/reset isCorrect
      const newChoices = choices.map((choice) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { correctOrder, ...rest } = choice;
        return rest;
      });
      setChoices(newChoices.length < 2 ? [...newChoices, createNewChoice(newChoices.length)] : newChoices);
    }

    setErrors([]);
  };

  const createNewChoice = (index: number): QuestionChoice => {
    return {
      id: crypto.randomUUID(),
      label: String.fromCharCode(65 + index),
      text: '',
      isCorrect: false,
    };
  };

  const handleAddChoice = (): void => {
    if (choices.length >= 10) {
      setErrors(['Maximum 10 choices allowed']);
      return;
    }

    const nextLabel = String.fromCharCode(65 + choices.length); // A, B, C...
    const newChoice: QuestionChoice = {
      id: crypto.randomUUID(),
      label: nextLabel,
      text: '',
      isCorrect: false,
    };

    // If sorting question, add correctOrder
    if (questionType === 'sorting') {
      newChoice.correctOrder = choices.length + 1;
    }

    setChoices([...choices, newChoice]);
    setErrors([]);
  };

  const handleRemoveChoice = (index: number): void => {
    if (choices.length <= 2) {
      setErrors(['Minimum 2 choices required']);
      return;
    }

    const newChoices = choices.filter((_, i) => i !== index);
    
    // Re-label remaining choices and update correctOrder for sorting questions
    const relabeledChoices = newChoices.map((choice, i) => {
      const updated = {
        ...choice,
        label: String.fromCharCode(65 + i),
      };
      
      // If sorting question, reassign correctOrder based on new position
      if (questionType === 'sorting' && choice.correctOrder !== undefined) {
        // Keep relative order: if correctOrder was greater than removed item's order, decrement it
        const removedOrder = choices[index]?.correctOrder ?? 0;
        if (choice.correctOrder > removedOrder) {
          updated.correctOrder = choice.correctOrder - 1;
        }
      }
      
      return updated;
    });

    setChoices(relabeledChoices);
    setErrors([]);
  };

  const validate = (): boolean => {
    const newErrors: string[] = [];

    if (!questionText.trim()) {
      newErrors.push('Question text is required');
    }

    if (questionType === 'fillInBlank') {
      // Validate fill-in-blank questions
      if (!questionText.includes('___')) {
        newErrors.push('Fill-in-blank question must contain ___ in the question text');
      }
      if (choices.length !== 1) {
        newErrors.push('Fill-in-blank question must have exactly 1 answer');
      }
      if (choices[0] && !choices[0].text.trim()) {
        newErrors.push('Answer must have text');
      }
    } else {
      if (choices.length < 2) {
        newErrors.push('At least 2 choices required');
      }

      if (questionType === 'sorting') {
        // Validate sorting questions
        const orders = choices.map((c) => c.correctOrder ?? 0);
        const uniqueOrders = new Set(orders);
        
        if (uniqueOrders.size !== choices.length) {
          newErrors.push('Each choice must have a unique order number');
        }
        
        // Check if orders are sequential from 1 to n
        const sortedOrders = [...orders].sort((a, b) => a - b);
        const expectedOrders = Array.from({ length: choices.length }, (_, i) => i + 1);
        const isSequential = sortedOrders.every((order, i) => order === expectedOrders[i]);
        
        if (!isSequential) {
          newErrors.push('Order numbers must be sequential (1, 2, 3...)');
        }
      } else {
        // Validate regular questions
        const correctChoices = choices.filter((c) => c.isCorrect);
        if (correctChoices.length === 0) {
          newErrors.push('At least one correct answer required');
        }
      }

      const emptyChoices = choices.filter((c) => !c.text.trim());
      if (emptyChoices.length > 0) {
        newErrors.push('All choices must have text');
      }
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

          {/* Question Type Toggle */}
          <div className="space-y-2">
            <Label className="font-semibold">Question Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={questionType === 'regular' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleChangeQuestionType('regular')}
                className="flex-1"
              >
                Regular
              </Button>
              <Button
                type="button"
                variant={questionType === 'sorting' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleChangeQuestionType('sorting')}
                className="flex-1"
              >
                Sorting
              </Button>
              <Button
                type="button"
                variant={questionType === 'fillInBlank' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleChangeQuestionType('fillInBlank')}
                className="flex-1"
              >
                Fill-in-Blank
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {questionType === 'sorting'
                ? 'Users drag items to reorder them correctly'
                : questionType === 'fillInBlank'
                  ? 'Users type their answer in a text input'
                  : 'Users select correct answer(s)'}
            </p>
          </div>

          {/* Choices */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>
                {questionType === 'sorting'
                  ? 'Items to Sort'
                  : questionType === 'fillInBlank'
                    ? 'Fill-in-Blank Answer'
                    : 'Answer Choices'}
              </Label>
              {questionType !== 'fillInBlank' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddChoice}
                  disabled={choices.length >= 10}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add {questionType === 'sorting' ? 'Item' : 'Choice'}
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {questionType === 'sorting' ? (
                // Sorting Question UI
                <>
                  {choices.map((choice, index) => (
                    <div key={choice.id} className="flex items-start gap-2">
                      <div className="flex items-center gap-2 pt-2">
                        <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                          {choice.label}
                        </Badge>
                        <Input
                          type="number"
                          min={1}
                          max={choices.length}
                          value={choice.correctOrder ?? index + 1}
                          onChange={(e) =>
                            handleCorrectOrderChange(index, parseInt(e.target.value) || 1)
                          }
                          className="w-16 text-center"
                          title="Correct order position"
                        />
                      </div>
                      <Input
                        value={choice.text}
                        onChange={(e) => handleChoiceTextChange(index, e.target.value)}
                        placeholder={`Item ${choice.label} text...`}
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
                  <p className="text-xs text-muted-foreground">
                    Set the correct order for each item (1 = first, 2 = second, etc.). Each number must
                    be unique.
                  </p>
                </>
              ) : questionType === 'fillInBlank' ? (
                // Fill-in-Blank Question UI
                <>
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">
                      📝 Fill-in-Blank Question
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
                      Students will type their answer in a text input field. The answer will be validated
                      with flexible matching (case-insensitive, ignores commas/spaces).
                    </p>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-blue-700 dark:text-blue-400">
                        Correct Answer:
                      </Label>
                      <Input
                        value={choices[0]?.text ?? ''}
                        onChange={(e) => handleChoiceTextChange(0, e.target.value)}
                        placeholder="Enter the correct answer..."
                        className="flex-1 bg-white dark:bg-gray-900"
                      />
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      Example: &ldquo;30,000,000&rdquo; will also accept &ldquo;30000000&rdquo; or
                      &ldquo;30 000 000&rdquo;
                    </p>
                  </div>
                </>
              ) : (
                // Regular Question UI
                <>
                  {choices.map((choice, index) => (
                    <div key={choice.id} className="flex items-start gap-2">
                      <div className="flex items-center gap-2 pt-2">
                        <Badge
                          variant="outline"
                          className="w-8 h-8 flex items-center justify-center"
                        >
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
                  <p className="text-xs text-muted-foreground">
                    Check the box to mark choice(s) as correct. Multiple correct answers are
                    supported.
                  </p>
                </>
              )}
            </div>
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
