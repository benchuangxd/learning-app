'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Question } from '@/types/question';
import { Download, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  exportQuestionsToJSON,
  parseImportedJSON,
  regenerateQuestionIDs,
} from '@/lib/utils/export-import';

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

      // Regenerate IDs to avoid conflicts
      const questionsWithNewIDs = regenerateQuestionIDs(result.questions);

      // Prompt user about merge strategy
      const shouldReplace = questions.length > 0
        ? window.confirm(
            `You have ${questions.length} existing question${questions.length !== 1 ? 's' : ''}.\n\n` +
              `Click OK to MERGE ${questionsWithNewIDs.length} new question${questionsWithNewIDs.length !== 1 ? 's' : ''} with existing.\n` +
              `Click Cancel to REPLACE all questions.`
          )
        : true;

      if (shouldReplace) {
        // Merge: add to existing
        onImport([...questions, ...questionsWithNewIDs]);
        const statusUpdate: typeof importStatus = {
          type: 'success',
          message: `Successfully imported ${questionsWithNewIDs.length} question${questionsWithNewIDs.length !== 1 ? 's' : ''}`,
        };
        if (result.warnings.length > 0) {
          statusUpdate.details = result.warnings;
        }
        setImportStatus(statusUpdate);
      } else {
        // Replace: use only imported
        onImport(questionsWithNewIDs);
        const statusUpdate: typeof importStatus = {
          type: 'success',
          message: `Replaced all questions with ${questionsWithNewIDs.length} imported question${questionsWithNewIDs.length !== 1 ? 's' : ''}`,
        };
        if (result.warnings.length > 0) {
          statusUpdate.details = result.warnings;
        }
        setImportStatus(statusUpdate);
      }

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
