import type { ReviewMetadata, Question } from '@/types/question';
import { LocalStorageAdapter, STORAGE_KEYS } from '@/lib/storage/local-storage';

const reviewMetadataStorage = new LocalStorageAdapter<Record<string, ReviewMetadata>>(
  STORAGE_KEYS.REVIEW_METADATA
);
const questionsStorage = new LocalStorageAdapter<Question[]>(STORAGE_KEYS.QUESTIONS);

/**
 * Statistics data for a single question
 */
export interface QuestionStatistics {
  questionId: string;
  category?: string;
  questionText: string; // For human readability
  easinessFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string; // ISO string for JSON serialization
  lastReviewed?: string; // ISO string for JSON serialization
}

/**
 * Export data structure for statistics
 */
export interface StatisticsExportData {
  version: string;
  exportDate: string;
  statisticsCount: number;
  statistics: QuestionStatistics[];
}

/**
 * Import result
 */
export interface StatisticsImportResult {
  success: boolean;
  statistics: QuestionStatistics[];
  errors: string[];
  warnings: string[];
  matchedCount: number; // Questions that matched by ID
  unmatchedCount: number; // Questions not found in current library
}

const EXPORT_VERSION = '1.0';

/**
 * Export statistics to JSON file
 */
export function exportStatisticsToJSON(): void {
  const reviewMetadata = reviewMetadataStorage.get() ?? {};
  const questions = questionsStorage.get() ?? [];
  
  // Create a map of questions for quick lookup
  const questionMap = new Map(questions.map(q => [q.id, q]));
  
  // Convert review metadata to export format (skip orphaned statistics)
  const statistics: QuestionStatistics[] = Object.values(reviewMetadata)
    .map((metadata) => {
      const question = questionMap.get(metadata.questionId);
      
      // Skip statistics for deleted questions (orphaned data)
      if (!question) {
        return null;
      }
      
      // Convert dates to ISO strings (handle both Date objects and string dates from storage)
      const nextReviewDate = metadata.nextReviewDate instanceof Date 
        ? metadata.nextReviewDate.toISOString()
        : typeof metadata.nextReviewDate === 'string'
          ? metadata.nextReviewDate
          : new Date(metadata.nextReviewDate).toISOString();
      
      const stat: QuestionStatistics = {
        questionId: metadata.questionId,
        questionText: question.text,
        easinessFactor: metadata.easinessFactor,
        interval: metadata.interval,
        repetitions: metadata.repetitions,
        nextReviewDate: nextReviewDate,
      };
      
      if (question.category) {
        stat.category = question.category;
      }
      
      if (metadata.lastReviewed) {
        const lastReviewed = metadata.lastReviewed instanceof Date
          ? metadata.lastReviewed.toISOString()
          : typeof metadata.lastReviewed === 'string'
            ? metadata.lastReviewed
            : new Date(metadata.lastReviewed).toISOString();
        stat.lastReviewed = lastReviewed;
      }
      
      return stat;
    })
    .filter((stat): stat is QuestionStatistics => stat !== null);
  
  const exportData: StatisticsExportData = {
    version: EXPORT_VERSION,
    exportDate: new Date().toISOString(),
    statisticsCount: statistics.length,
    statistics,
  };
  
  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `learning-app-statistics-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validate imported statistics data
 */
function validateStatistics(
  data: unknown,
  index: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (typeof data !== 'object' || data === null) {
    errors.push(`Statistic ${index + 1}: Invalid object`);
    return { valid: false, errors };
  }
  
  const stat = data as Record<string, unknown>;
  
  // Required fields
  if (typeof stat.questionId !== 'string' || !stat.questionId) {
    errors.push(`Statistic ${index + 1}: Missing or invalid questionId`);
  }
  
  if (typeof stat.easinessFactor !== 'number' || stat.easinessFactor < 1.3 || stat.easinessFactor > 2.5) {
    errors.push(`Statistic ${index + 1}: Invalid easinessFactor (must be 1.3-2.5)`);
  }
  
  if (typeof stat.interval !== 'number' || stat.interval < 0) {
    errors.push(`Statistic ${index + 1}: Invalid interval (must be >= 0)`);
  }
  
  if (typeof stat.repetitions !== 'number' || stat.repetitions < 0) {
    errors.push(`Statistic ${index + 1}: Invalid repetitions (must be >= 0)`);
  }
  
  if (typeof stat.nextReviewDate !== 'string') {
    errors.push(`Statistic ${index + 1}: Invalid nextReviewDate`);
  } else {
    const date = new Date(stat.nextReviewDate);
    if (isNaN(date.getTime())) {
      errors.push(`Statistic ${index + 1}: Invalid nextReviewDate format`);
    }
  }
  
  // Optional field
  if (stat.lastReviewed !== undefined && typeof stat.lastReviewed !== 'string') {
    errors.push(`Statistic ${index + 1}: Invalid lastReviewed`);
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Parse imported JSON file
 */
export function parseImportedStatistics(jsonString: string): StatisticsImportResult {
  const result: StatisticsImportResult = {
    success: false,
    statistics: [],
    errors: [],
    warnings: [],
    matchedCount: 0,
    unmatchedCount: 0,
  };
  
  try {
    const data = JSON.parse(jsonString) as unknown;
    
    if (typeof data !== 'object' || data === null) {
      result.errors.push('Invalid JSON structure: Expected an object');
      return result;
    }
    
    const exportData = data as Record<string, unknown>;
    
    // Check version
    if (typeof exportData.version !== 'string') {
      result.warnings.push('Missing or invalid version field');
    }
    
    // Check statistics array
    if (!Array.isArray(exportData.statistics)) {
      result.errors.push('Invalid JSON structure: Missing or invalid statistics array');
      return result;
    }
    
    // Get current questions to check which statistics can be matched
    const questions = questionsStorage.get() ?? [];
    const questionIds = new Set(questions.map(q => q.id));
    
    // Debug logging
    console.log('[Statistics Import] Total questions in library:', questions.length);
    console.log('[Statistics Import] Question IDs:', Array.from(questionIds).slice(0, 5));
    console.log('[Statistics Import] Total statistics to import:', exportData.statistics.length);
    
    // Validate each statistic
    const validStatistics: QuestionStatistics[] = [];
    
    for (let i = 0; i < exportData.statistics.length; i++) {
      const stat = exportData.statistics[i];
      const validation = validateStatistics(stat, i);
      
      if (!validation.valid) {
        result.errors.push(...validation.errors);
        continue;
      }
      
      const questionStat = stat as QuestionStatistics;
      
      // Debug first few mismatches
      if (i < 3) {
        console.log(`[Statistics Import] Checking stat ${i + 1}:`, questionStat.questionId, 'exists:', questionIds.has(questionStat.questionId));
      }
      
      // Check if question exists in current library
      if (!questionIds.has(questionStat.questionId)) {
        result.unmatchedCount++;
        result.warnings.push(
          `Question not found for statistic ${i + 1}: "${questionStat.questionText}" (ID: ${questionStat.questionId})`
        );
        continue;
      }
      
      result.matchedCount++;
      validStatistics.push(questionStat);
    }
    
    result.statistics = validStatistics;
    result.success = validStatistics.length > 0 || result.errors.length === 0;
    
    if (validStatistics.length === 0 && result.errors.length === 0) {
      result.warnings.push('No statistics matched any questions in your current library');
    }
    
    return result;
  } catch (error) {
    result.errors.push(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
}

/**
 * Import statistics into storage
 */
export function importStatistics(
  statistics: QuestionStatistics[],
  mode: 'merge' | 'replace'
): boolean {
  try {
    let reviewMetadata = reviewMetadataStorage.get() ?? {};
    
    if (mode === 'replace') {
      reviewMetadata = {};
    }
    
    // Convert imported statistics to ReviewMetadata format
    for (const stat of statistics) {
      const metadata: ReviewMetadata = {
        questionId: stat.questionId,
        easinessFactor: stat.easinessFactor,
        interval: stat.interval,
        repetitions: stat.repetitions,
        nextReviewDate: new Date(stat.nextReviewDate),
      };
      
      if (stat.lastReviewed) {
        metadata.lastReviewed = new Date(stat.lastReviewed);
      }
      
      reviewMetadata[stat.questionId] = metadata;
    }
    
    return reviewMetadataStorage.set(reviewMetadata);
  } catch (error) {
    console.error('Failed to import statistics:', error);
    return false;
  }
}

/**
 * Get statistics summary (only for existing questions)
 */
export function getStatisticsSummary(): {
  totalStatistics: number;
  withProgress: number;
  categories: Map<string, number>;
  orphanedCount: number;
} {
  const reviewMetadata = reviewMetadataStorage.get() ?? {};
  const questions = questionsStorage.get() ?? [];
  
  const questionMap = new Map(questions.map(q => [q.id, q]));
  const categories = new Map<string, number>();
  
  let totalStatistics = 0;
  let withProgress = 0;
  let orphanedCount = 0;
  
  // Only count statistics for questions that still exist
  for (const metadata of Object.values(reviewMetadata)) {
    const question = questionMap.get(metadata.questionId);
    
    // Count orphaned statistics (question no longer exists)
    if (!question) {
      orphanedCount++;
      continue;
    }
    
    totalStatistics++;
    
    if (metadata.repetitions > 0) {
      withProgress++;
    }
    
    if (question.category) {
      categories.set(question.category, (categories.get(question.category) ?? 0) + 1);
    }
  }
  
  return {
    totalStatistics,
    withProgress,
    categories,
    orphanedCount,
  };
}

/**
 * Clean up orphaned statistics (for questions that no longer exist)
 */
export function cleanupOrphanedStatistics(): number {
  const reviewMetadata = reviewMetadataStorage.get() ?? {};
  const questions = questionsStorage.get() ?? [];
  
  const questionIds = new Set(questions.map(q => q.id));
  const cleanedMetadata: Record<string, ReviewMetadata> = {};
  
  let removedCount = 0;
  
  for (const [questionId, metadata] of Object.entries(reviewMetadata)) {
    if (questionIds.has(questionId)) {
      cleanedMetadata[questionId] = metadata;
    } else {
      removedCount++;
    }
  }
  
  if (removedCount > 0) {
    reviewMetadataStorage.set(cleanedMetadata);
  }
  
  return removedCount;
}
