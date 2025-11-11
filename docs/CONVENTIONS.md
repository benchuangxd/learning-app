# Project Conventions

## File Structure

```
app/                    → Next.js App Router
  layout.tsx           → Root layout
  page.tsx             → Home page
  study/               → Study session routes
  questions/           → Question management routes
  stats/               → Statistics routes
  globals.css          → Global styles (Tailwind V4)

components/            → React components
  ui/                  → ShadCN UI components
  questions/           → Question-specific components
  study/               → Study session components
  layout/              → Layout components (nav, footer)

lib/                   → Utilities and helpers
  storage/             → LocalStorage adapters
  parsers/             → Data parsers
  algorithms/          → Spaced repetition logic
  utils.ts             → Utility functions (cn helper)

types/                 → TypeScript type definitions
  question.ts          → Question-related types
  study.ts             → Study session types

docs/                  → Reference documentation
  TAILWIND_V4.md
  SHADCN.md
  TYPESCRIPT.md
  CONVENTIONS.md
```

## Naming Conventions

### Files

- Components: PascalCase → `QuestionCard.tsx`
- Utilities: camelCase → `parseQuestions.ts`
- Types: camelCase → `question.ts`
- Constants: UPPERCASE → `CONSTANTS.ts`
- Config: kebab-case → `postcss.config.mjs`

### Components

```typescript
// PascalCase for component names
export function QuestionCard({ question }: QuestionCardProps) {
  return <div>...</div>;
}
```

### Functions

```typescript
// camelCase for functions
export function calculateScore(attempts: Attempt[]): number {
  // Implementation
}

// Async functions clearly named
export async function fetchQuestions(): Promise<Question[]> {
  // Implementation
}
```

### Variables

```typescript
// camelCase for variables
const questionCount = 10;
const isLoading = false;

// UPPERCASE for constants
const MAX_QUESTIONS = 100;
const API_TIMEOUT = 5000;
```

### Types/Interfaces

```typescript
// PascalCase for types and interfaces
interface Question {
  id: string;
  text: string;
}

type QuestionId = string;

// Prefix with 'I' optional (not required)
interface IQuestion {} // Optional style
```

## Component Patterns

### Client vs Server Components

```typescript
// Server Component (default)
export function QuestionList({ questions }: Props) {
  return <div>...</div>;
}

// Client Component (mark explicitly)
'use client';

export function QuestionForm() {
  const [state, setState] = useState();
  return <form>...</form>;
}
```

### Props Interface Pattern

```typescript
// Define props interface inline or separately
interface QuestionCardProps {
  question: Question;
  onSelect?: (id: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export function QuestionCard({ question, onSelect, className, children }: QuestionCardProps) {
  // Implementation
}
```

### Composition Pattern

```typescript
// Prefer composition over props drilling
<Card>
  <CardHeader>
    <CardTitle>Question {index + 1}</CardTitle>
  </CardHeader>
  <CardContent>
    {children}
  </CardContent>
</Card>
```

## React Hooks

### Hook Order

```typescript
function MyComponent() {
  // 1. State hooks
  const [state, setState] = useState();
  const [data, setData] = useState();

  // 2. Refs
  const ref = useRef();

  // 3. Context
  const context = useContext(MyContext);

  // 4. Effects
  useEffect(() => {
    // Side effects
  }, []);

  // 5. Callbacks
  const handleClick = useCallback(() => {
    // Handler
  }, []);

  // 6. Memos
  const computed = useMemo(() => {
    // Expensive computation
  }, [dep]);

  return <div>...</div>;
}
```

### Custom Hooks

```typescript
// Custom hooks start with 'use'
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (stored) {
      setValue(JSON.parse(stored));
    }
  }, [key]);

  const updateValue = useCallback(
    (newValue: T) => {
      setValue(newValue);
      localStorage.setItem(key, JSON.stringify(newValue));
    },
    [key]
  );

  return [value, updateValue] as const;
}
```

## Styling

### Tailwind Classes

```typescript
// Use cn() helper for conditional classes
<div className={cn(
  "base-class",
  isActive && "active-class",
  className
)}>
```

### Component Variants (ShadCN Pattern)

```typescript
const cardVariants = cva('base-classes', {
  variants: {
    variant: {
      default: 'default-classes',
      outline: 'outline-classes',
    },
    size: {
      sm: 'small-classes',
      md: 'medium-classes',
      lg: 'large-classes',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});
```

## Error Handling

### Try-Catch Blocks

```typescript
async function fetchData(): Promise<Data | null> {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch data:', error);
    return null;
  }
}
```

### Error Boundaries (React)

```typescript
'use client';

export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong</div>;
    }
    return this.props.children;
  }
}
```

## Data Fetching (Next.js App Router)

### Server Component Fetching

```typescript
async function getData(): Promise<Data[]> {
  const res = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!res.ok) {
    throw new Error('Failed to fetch data');
  }

  return res.json();
}

export default async function Page() {
  const data = await getData();
  return <div>{/* Render data */}</div>;
}
```

### Client Component Fetching

```typescript
'use client';

export function ClientComponent() {
  const [data, setData] = useState<Data[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;
  return <div>{/* Render data */}</div>;
}
```

## Git Workflow

### Branch Naming

- Feature: `feature/question-import`
- Bug fix: `fix/parser-error`
- Refactor: `refactor/storage-layer`
- Docs: `docs/update-readme`

### Commit Messages

```bash
# Format: type(scope): message
feat(questions): add import validation
fix(parser): handle multi-line explanations
refactor(storage): extract LocalStorage adapter
docs(readme): update installation steps
style(ui): improve button spacing
test(parser): add edge case tests
chore(deps): update dependencies
```

### Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `docs`: Documentation only
- `style`: Formatting, missing semi-colons, etc.
- `test`: Adding tests
- `chore`: Maintenance tasks

### Pull Request Process

1. Create feature branch from `main`
2. Make changes with clear commits
3. Run `npm run lint` and `npm run type-check`
4. Push branch and create PR
5. Get review approval
6. Squash and merge to `main`

## Code Comments

### When to Comment

```typescript
// ❌ Bad - obvious comment
// Increment counter
counter++;

// ✅ Good - explains WHY
// Reset counter when limit reached to prevent overflow
if (counter >= MAX_SAFE_INTEGER) {
  counter = 0;
}

// ✅ Good - complex logic
/**
 * Calculate the next review date using spaced repetition algorithm
 * Based on SM-2 algorithm with modifications for our use case
 */
function calculateNextReview(metadata: ReviewMetadata): Date {
  // Implementation
}
```

### JSDoc Comments

```typescript
/**
 * Parse question text from markdown format to Question object
 * @param input - Raw markdown string
 * @returns Parsed questions and any errors encountered
 * @throws {Error} If input is empty or null
 */
export function parseQuestions(input: string): ParseResult {
  // Implementation
}
```

## Testing (Optional for MVP)

### Test File Naming

- Component tests: `QuestionCard.test.tsx`
- Unit tests: `parseQuestions.test.ts`
- Integration tests: `study-flow.integration.test.tsx`

### Test Structure

```typescript
describe('parseQuestions', () => {
  it('should parse valid question format', () => {
    const input = '**Question 1 (1 point)**...';
    const result = parseQuestions(input);
    expect(result.questions).toHaveLength(1);
  });

  it('should handle invalid format gracefully', () => {
    const input = 'Invalid format';
    const result = parseQuestions(input);
    expect(result.errors).not.toHaveLength(0);
  });
});
```

## Performance

### Lazy Loading

```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

### Memoization

```typescript
const MemoizedComponent = memo(function ExpensiveComponent({ data }: Props) {
  return <div>{/* Expensive render */}</div>;
});
```

## Accessibility

### Semantic HTML

```typescript
// ✅ Good - semantic
<button onClick={handleClick}>Submit</button>

// ❌ Bad - non-semantic
<div onClick={handleClick}>Submit</div>
```

### ARIA Labels

```typescript
<button
  onClick={handleClick}
  aria-label="Close dialog"
  aria-pressed={isActive}
>
  <CloseIcon />
</button>
```

## Documentation

### Keep Updated

- Update AGENTS.md when build process changes
- Update reference docs when patterns change
- Keep README.md current for new developers
- Document breaking changes in commits

### Reference Docs Pattern

- Each doc under 250 lines
- Clear examples for each pattern
- Link between related docs
- Keep actionable and concise
