# Lib Directory

Utilities, services, algorithms, and helpers for the Learning App.

## Directory Structure

```
lib/
├── algorithms/          → Core algorithms (SM-2)
├── services/            → Business logic services
├── storage/             → Storage adapters
├── parsers/             → Data parsers
└── utils.ts             → Utility functions
```

## Module Organization

### Algorithms (`lib/algorithms/`)

**SM-2 Algorithm** (`sm2.ts`):
- Spaced repetition calculations
- Interval computation
- Ease factor adjustment
- Pure functions (no side effects)
- Fully typed with interfaces

**Usage**:
```typescript
import { calculateSM2, getQualityRating } from '@/lib/algorithms/sm2';

const result = calculateSM2({
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
  quality: 4, // 0-5
});
// Returns: { easeFactor, interval, repetitions, nextReviewDate }
```

### Services (`lib/services/`)

**Review Service** (`review-service.ts`):
- Manages review metadata
- Calculates statistics
- Filters due questions
- Integrates SM-2 with storage

**Key Functions**:
- `getReviewMetadata(questionId)` - Get review status
- `updateReviewMetadata(questionId, isCorrect)` - Update after answer
- `getDueQuestions(questions)` - Filter due questions
- `getReviewStats(questions)` - Calculate statistics

**Usage**:
```typescript
import { updateReviewMetadata, getDueQuestions } from '@/lib/services/review-service';

// After answering
updateReviewMetadata(questionId, isCorrect);

// Get due questions
const dueQuestions = getDueQuestions(allQuestions);
```

### Storage (`lib/storage/`)

**LocalStorage Adapter** (`local-storage.ts`):
- Type-safe storage wrapper
- Error handling
- Quota exceeded handling
- JSON serialization

**Storage Keys**:
```typescript
STORAGE_KEYS = {
  QUESTIONS: 'learning-app:questions',
  SESSIONS: 'learning-app:sessions',
  REVIEW_METADATA: 'learning-app:review-metadata',
  SETTINGS: 'learning-app:settings',
}
```

**Usage**:
```typescript
import { LocalStorageAdapter, STORAGE_KEYS } from '@/lib/storage/local-storage';

const storage = new LocalStorageAdapter<Question[]>(STORAGE_KEYS.QUESTIONS);

// Get data
const questions = storage.get(); // Question[] | null

// Set data
storage.set(questions); // boolean (success/fail)

// Remove data
storage.remove();

// Check existence
storage.exists(); // boolean
```

### Parsers (`lib/parsers/`)

**Question Parser** (`question-parser.ts`):
- Parses markdown to Question objects
- Supports multiple formats
- Error reporting with context
- Validation

**Supported Formats**:
1. A-F labeled choices
2. Bullet list format (`- text ✅`)
3. Multiple correct answers
4. "Options:" label before choices
5. `---` separators between questions

**Usage**:
```typescript
import { parseQuestions } from '@/lib/parsers/question-parser';

const result = parseQuestions(markdownText);
// Returns: { questions: Question[], errors: ParseError[] }

if (result.errors.length > 0) {
  // Handle errors
}
```

### Utilities (`lib/utils.ts`)

**cn() Helper**:
- Merge Tailwind classes safely
- Handle conditional classes
- Remove duplicates

**Usage**:
```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  "base-class",
  isActive && "active-class",
  "another-class"
)} />
```

## Type Safety Guidelines

### Pure Functions

**All lib functions should be pure** when possible:
- Same input → same output
- No side effects (except storage operations)
- Easy to test
- Predictable behavior

### Type Definitions

**Always explicit**:
```typescript
// Good
export function calculate(input: number): number {
  return input * 2;
}

// Bad
export function calculate(input) {  // No types
  return input * 2;
}
```

### Error Handling

**Return types over throws**:
```typescript
// Good
export function parse(input: string): { data: T | null; error: string | null } {
  try {
    return { data: JSON.parse(input), error: null };
  } catch (e) {
    return { data: null, error: 'Parse failed' };
  }
}
```

## Testing Lib Functions

### Type Checking

```bash
# Verify all types
npm run type-check
```

### Manual Testing

Test functions in components:
- SM-2 algorithm → Study session
- Review service → Statistics page
- Parser → Question import
- Storage → All components

## Common Patterns

### Async Operations

```typescript
export async function fetchData(): Promise<Data> {
  // Implementation
}
```

### Date Handling

```typescript
// Always use Date objects internally
export function calculateNextReview(): Date {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);
  return nextDate;
}

// Convert to/from ISO strings for storage
JSON.stringify(date)  // Storage
new Date(isoString)   // Retrieval
```

### Constants

```typescript
// Use 'as const' for immutability
export const STORAGE_KEYS = {
  QUESTIONS: 'learning-app:questions',
} as const;
```

## Performance Considerations

### Memoization

Not needed for:
- Simple calculations (SM-2 algorithm)
- Small data sets (< 1000 questions)
- One-time operations (parsing)

### Storage

- LocalStorage is synchronous
- Keep data size reasonable (< 5MB)
- Consider IndexedDB for > 1000 questions

---

**For build commands**, see root `AGENTS.md`.

**For component usage**, see `components/AGENTS.md`.

**For detailed patterns**, see `docs/` folder.
