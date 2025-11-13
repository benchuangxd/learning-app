'use client';

import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Question } from '@/types/question';
import { Download, Upload, AlertCircle, CheckCircle2, Folder } from 'lucide-react';
import {
  exportQuestionsToJSON,
  parseImportedJSON,
  regenerateQuestionIDs,
} from '@/lib/utils/export-import';
import { LocalStorageAdapter, STORAGE_KEYS } from '@/lib/storage/local-storage';

const questionsStorage = new LocalStorageAdapter<Question[]>(STORAGE_KEYS.QUESTIONS);

interface ExportImportControlsProps {
  questions: Question[];
  onImport: (questions: Question[]) => void;
}

export function ExportImportControls({
  questions,
  onImport,
}: ExportImportControlsProps): React.ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | 'warning' | null;
    message: string;
    details?: string[];
  }>({ type: null, message: '' });
  const [category, setCategory] = useState<string>('');
  const [existingCategories, setExistingCategories] = useState<string[]>([]);

  // Load existing categories
  useEffect(() => {
    const stored = questionsStorage.get();
    if (stored) {
      const categories = [...new Set(stored.map(q => q.category).filter(Boolean) as string[])];
      setExistingCategories(categories.sort());
    }
  }, [questions]);

  const handleExport = (): void => {
    if (questions.length === 0) {
      setImportStatus({
        type: 'warning',
        message: 'No questions to export',
      });
      return;
    }

    try {
      exportQuestionsToJSON(questions);
      setImportStatus({
        type: 'success',
        message: `Successfully exported ${questions.length} question${questions.length !== 1 ? 's' : ''}`,
      });
      setTimeout(() => setImportStatus({ type: null, message: '' }), 5000);
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: 'Export failed',
        details: [error instanceof Error ? error.message : 'Unknown error'],
      });
    }
  };

  const handleImportClick = (): void => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be selected again
    event.target.value = '';

    if (!file.name.endsWith('.json')) {
      setImportStatus({
        type: 'error',
        message: 'Invalid file type',
        details: ['Please select a JSON file'],
      });
      return;
    }

    try {
      const text = await file.text();
      const result = parseImportedJSON(text);

      if (!result.success || result.questions.length === 0) {
        setImportStatus({
          type: 'error',
          message: 'Import failed',
          details: result.errors,
        });
        return;
      }

      // Ask user if they want to preserve IDs (for backup restore) or generate new ones
      const preserveIDs = window.confirm(
        'Do you want to preserve the original question IDs?\n\n' +
        'Click OK to PRESERVE IDs (recommended for restoring backups with statistics).\n' +
        'Click Cancel to GENERATE NEW IDs (recommended for importing from other sources).'
      );

      // Regenerate IDs only if user chooses to
      let questionsWithNewIDs = preserveIDs ? result.questions : regenerateQuestionIDs(result.questions);

      // Apply category if specified
      if (category.trim()) {
        questionsWithNewIDs = questionsWithNewIDs.map(q => ({
          ...q,
          category: category.trim(),
        }));
      }

      // Prompt user about merge strategy
      const categoryInfo = category.trim() ? ` to category "${category.trim()}"` : '';
      const validationWarning = result.errors.length > 0
        ? `\n\nWARNING: ${result.errors.length} question${result.errors.length !== 1 ? 's' : ''} failed validation and will be skipped.`
        : '';
      const shouldReplace = questions.length > 0
        ? window.confirm(
            `You have ${questions.length} existing question${questions.length !== 1 ? 's' : ''}.\n\n` +
              `Click OK to MERGE ${questionsWithNewIDs.length} new question${questionsWithNewIDs.length !== 1 ? 's' : ''}${categoryInfo} with existing.\n` +
              `Click Cancel to REPLACE all questions.${validationWarning}`
          )
        : true;

      if (shouldReplace) {
        // Merge: add to existing
        onImport([...questions, ...questionsWithNewIDs]);
        const categoryMsg = category.trim() ? ` into "${category.trim()}"` : '';
        const statusUpdate: typeof importStatus = {
          type: result.errors.length > 0 ? 'warning' : 'success',
          message: result.errors.length > 0
            ? `Imported ${questionsWithNewIDs.length} questions${categoryMsg}, but ${result.errors.length} failed validation`
            : `Successfully imported ${questionsWithNewIDs.length} question${questionsWithNewIDs.length !== 1 ? 's' : ''}${categoryMsg}`,
        };
        if (result.errors.length > 0 || result.warnings.length > 0) {
          statusUpdate.details = [...result.errors, ...result.warnings];
        }
        setImportStatus(statusUpdate);
      } else {
        // Replace: use only imported
        onImport(questionsWithNewIDs);
        const categoryMsg = category.trim() ? ` in "${category.trim()}"` : '';
        const statusUpdate: typeof importStatus = {
          type: result.errors.length > 0 ? 'warning' : 'success',
          message: result.errors.length > 0
            ? `Replaced with ${questionsWithNewIDs.length} questions${categoryMsg}, but ${result.errors.length} failed validation`
            : `Replaced all questions with ${questionsWithNewIDs.length} imported question${questionsWithNewIDs.length !== 1 ? 's' : ''}${categoryMsg}`,
        };
        if (result.errors.length > 0 || result.warnings.length > 0) {
          statusUpdate.details = [...result.errors, ...result.warnings];
        }
        setImportStatus(statusUpdate);
      }

      setCategory('');
      setTimeout(() => setImportStatus({ type: null, message: '' }), 5000);
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: 'Failed to read file',
        details: [error instanceof Error ? error.message : 'Unknown error'],
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={questions.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Questions
          </Button>
          <Button variant="outline" size="sm" onClick={handleImportClick}>
            <Upload className="h-4 w-4 mr-2" />
            Import Questions
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Category Input for Import */}
        <div className="space-y-2 p-3 border rounded-lg bg-muted/50">
          <Label htmlFor="import-category" className="flex items-center gap-2 text-sm">
            <Folder className="h-3 w-3" />
            Import Category (Optional)
          </Label>
          <Input
            id="import-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., Math, History..."
            list="import-categories"
            className="h-8"
          />
          <datalist id="import-categories">
            {existingCategories.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
          <p className="text-xs text-muted-foreground">
            Assign imported questions to a category
          </p>
        </div>
      </div>

      {/* Status Messages */}
      {importStatus.type && (
        <Alert variant={importStatus.type === 'error' ? 'destructive' : 'default'}>
          {importStatus.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
          {importStatus.type === 'error' && <AlertCircle className="h-4 w-4" />}
          {importStatus.type === 'warning' && <AlertCircle className="h-4 w-4" />}
          <AlertDescription>
            <p className="font-semibold">{importStatus.message}</p>
            {importStatus.details && importStatus.details.length > 0 && (
              <ul className="mt-2 text-sm list-disc list-inside">
                {importStatus.details.map((detail, i) => (
                  <li key={i}>{detail}</li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
