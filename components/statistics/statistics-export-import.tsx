'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, AlertCircle, CheckCircle2, BarChart3, TrendingUp } from 'lucide-react';
import {
  exportStatisticsToJSON,
  parseImportedStatistics,
  importStatistics,
  getStatisticsSummary,
  cleanupOrphanedStatistics,
  type StatisticsImportResult,
} from '@/lib/utils/statistics-export-import';

interface StatisticsExportImportProps {
  onImportComplete?: () => void;
}

export function StatisticsExportImport({
  onImportComplete,
}: StatisticsExportImportProps): React.ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | 'warning' | null;
    message: string;
    details?: string[];
    result?: StatisticsImportResult;
  }>({ type: null, message: '' });

  const summary = getStatisticsSummary();

  const handleCleanup = (): void => {
    if (summary.orphanedCount === 0) {
      setImportStatus({
        type: 'success',
        message: 'No orphaned statistics found',
        details: ['Your statistics are already clean!'],
      });
      setTimeout(() => setImportStatus({ type: null, message: '' }), 3000);
      return;
    }

    const confirmed = window.confirm(
      `Found ${summary.orphanedCount} orphaned statistic${summary.orphanedCount !== 1 ? 's' : ''} for deleted questions.\n\n` +
      `Click OK to remove ${summary.orphanedCount !== 1 ? 'them' : 'it'}.`
    );

    if (!confirmed) {
      return;
    }

    const removedCount = cleanupOrphanedStatistics();
    setImportStatus({
      type: 'success',
      message: `Cleaned up ${removedCount} orphaned statistic${removedCount !== 1 ? 's' : ''}`,
      details: ['Statistics for deleted questions have been removed.'],
    });
    onImportComplete?.();
    setTimeout(() => setImportStatus({ type: null, message: '' }), 5000);
  };

  const handleExport = (): void => {
    if (summary.totalStatistics === 0) {
      setImportStatus({
        type: 'warning',
        message: 'No statistics to export',
        details: ['Start studying some questions to build up your progress statistics.'],
      });
      return;
    }

    try {
      exportStatisticsToJSON();
      setImportStatus({
        type: 'success',
        message: `Successfully exported ${summary.totalStatistics} statistics records`,
        details: [
          `Questions with progress: ${summary.withProgress}`,
          `Categories tracked: ${summary.categories.size}`,
        ],
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
      const result = parseImportedStatistics(text);

      if (!result.success || result.statistics.length === 0) {
        setImportStatus({
          type: 'error',
          message: 'Import failed',
          details: [
            ...result.errors,
            ...(result.unmatchedCount > 0
              ? [`${result.unmatchedCount} statistics couldn't be matched to questions in your library`]
              : []),
          ],
          result,
        });
        return;
      }

      // Show preview and ask user about merge strategy
      const shouldMerge = window.confirm(
        `Found ${result.matchedCount} statistics that match questions in your library.` +
        (result.unmatchedCount > 0
          ? `\n\n${result.unmatchedCount} statistics couldn't be matched and will be skipped.`
          : '') +
        `\n\nClick OK to MERGE with existing statistics (keeps your current progress).` +
        `\nClick Cancel to REPLACE all statistics (overwrites current progress).`
      );

      const mode = shouldMerge ? 'merge' : 'replace';
      const success = importStatistics(result.statistics, mode);

      if (success) {
        setImportStatus({
          type: 'success',
          message: `Successfully imported ${result.matchedCount} statistics (${mode} mode)`,
          details: [
            ...(result.warnings.length > 0 ? [`Warnings: ${result.warnings.length}`] : []),
            ...(result.unmatchedCount > 0 ? [`Skipped: ${result.unmatchedCount} unmatched`] : []),
          ],
          result,
        });
        onImportComplete?.();
      } else {
        setImportStatus({
          type: 'error',
          message: 'Failed to save statistics',
          details: ['Storage operation failed. Please try again.'],
        });
      }

      setTimeout(() => setImportStatus({ type: null, message: '' }), 8000);
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: 'Failed to read file',
        details: [error instanceof Error ? error.message : 'Unknown error'],
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          <CardTitle>Statistics Backup</CardTitle>
        </div>
        <CardDescription>
          Export and import your learning progress and spaced repetition data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Statistics Summary */}
        <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
          <p className="text-sm font-medium">Current Statistics</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Total Records:</span>
              <span className="ml-2 font-semibold">{summary.totalStatistics}</span>
            </div>
            <div>
              <span className="text-muted-foreground">With Progress:</span>
              <span className="ml-2 font-semibold">{summary.withProgress}</span>
            </div>
          </div>
          {summary.categories.size > 0 && (
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-1">Categories:</p>
              <div className="flex flex-wrap gap-1">
                {Array.from(summary.categories.entries()).map(([category, count]) => (
                  <Badge key={category} variant="secondary" className="text-xs">
                    {category}: {count}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {summary.orphanedCount > 0 && (
            <div className="pt-2">
              <Alert variant="default" className="py-2">
                <AlertCircle className="h-3 w-3" />
                <AlertDescription className="text-xs">
                  {summary.orphanedCount} orphaned statistic{summary.orphanedCount !== 1 ? 's' : ''} for deleted questions.
                  <button
                    onClick={handleCleanup}
                    className="ml-2 underline hover:no-underline font-medium"
                  >
                    Clean up
                  </button>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        {/* Export/Import Controls */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={summary.totalStatistics === 0}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Statistics
          </Button>
          <Button variant="outline" size="sm" onClick={handleImportClick} className="flex-1">
            <Upload className="h-4 w-4 mr-2" />
            Import Statistics
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
            <AlertTitle className="font-semibold">{importStatus.message}</AlertTitle>
            {importStatus.details && importStatus.details.length > 0 && (
              <AlertDescription>
                <ul className="mt-2 text-sm list-disc list-inside space-y-1">
                  {importStatus.details.map((detail, i) => (
                    <li key={i}>{detail}</li>
                  ))}
                </ul>
              </AlertDescription>
            )}
            {importStatus.result && importStatus.result.warnings.length > 0 && (
              <AlertDescription>
                <details className="mt-2">
                  <summary className="text-sm font-medium cursor-pointer">
                    View {importStatus.result.warnings.length} warnings
                  </summary>
                  <ul className="mt-2 text-xs list-disc list-inside space-y-1 max-h-32 overflow-y-auto">
                    {importStatus.result.warnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </details>
              </AlertDescription>
            )}
          </Alert>
        )}

        {/* Info */}
        <div className="rounded-lg border p-3 space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="space-y-1">
              <p className="font-medium">What&apos;s included:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Spaced repetition data (intervals, repetitions)</li>
                <li>• Ease factors and next review dates</li>
                <li>• Question IDs and categories for matching</li>
                <li>• Last review timestamps</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
