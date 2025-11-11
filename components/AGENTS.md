# Components Directory

Component patterns and conventions for the Learning App.

## Directory Structure

```
components/
├── layout/              → Layout components (navbar, theme)
├── questions/           → Question management components
├── study/               → Study session components
└── ui/                  → ShadCN UI base components
```

## Component Conventions

### Client vs Server Components

**Client Components** (require 'use client'):
- All interactive components (buttons, forms, state management)
- Components using hooks (useState, useEffect, etc.)
- Components accessing browser APIs (LocalStorage, window)
- Event handlers (onClick, onChange)

**Server Components** (default):
- Static content only
- No interactivity
- No hooks or browser APIs

### File Naming

- **PascalCase**: `QuestionCard.tsx`, `StudySession.tsx`
- **Descriptive**: Clear purpose from name
- **Colocation**: Keep related components together

## ShadCN UI Components

### Adding Components

**Always use CLI** (never copy-paste):
```bash
npx shadcn@latest add [component-name]
```

**Available components** (`components/ui/`):
- button, card, badge, alert
- input, textarea, label
- dialog, dropdown-menu
- progress, radio-group
- And more...

### Customization

- Components installed to `components/ui/`
- Modify sparingly (prefer composition)
- Use Tailwind classes for styling
- Keep accessibility features intact

## Component Patterns

### Type Safety

**All props typed:**
```typescript
interface MyComponentProps {
  items: Item[];
  onSelect: (id: string) => void;
  variant?: 'default' | 'compact';
}

export function MyComponent({ 
  items, 
  onSelect,
  variant = 'default' 
}: MyComponentProps): React.ReactElement {
  // Implementation
}
```

**No `any` types allowed** - use proper types or `unknown`.

### State Management

**Local State** (most components):
```typescript
const [value, setValue] = useState<string>('');
```

**Prop Drilling** (for small apps like ours):
- Pass props through components
- Keep state close to usage
- No global state needed (LocalStorage for persistence)

### Event Handlers

**Naming convention**:
```typescript
const handleClick = (): void => { /* ... */ };
const handleSubmit = (e: FormEvent): void => { /* ... */ };
const handleChange = (value: string): void => { /* ... */ };
```

**Always typed**: Explicit return types and parameter types.

## Custom Components

### Layout Components (`components/layout/`)

**Navbar** (`navbar.tsx`):
- Global navigation bar
- Shows on every page
- Active route highlighting
- Theme toggle integration

**ThemeProvider** (`theme-provider.tsx`):
- Wraps app in theme context
- Handles dark mode state
- Uses next-themes

**ThemeToggle** (`theme-toggle.tsx`):
- Theme switcher dropdown
- Light/Dark/System options
- Persists to LocalStorage

### Question Components (`components/questions/`)

**QuestionImport** (`question-import.tsx`):
- Textarea for markdown input
- Live parsing and preview
- Error display
- Saves to LocalStorage

**QuestionList** (`question-list.tsx`):
- Displays all questions
- Edit and delete actions
- Expandable explanations
- Cross-tab sync

**QuestionEditDialog** (`question-edit-dialog.tsx`):
- Edit existing questions
- Form validation
- Dynamic choice management
- Markdown support hint

### Study Components (`components/study/`)

**StudySession** (`study-session.tsx`):
- Question display with choices
- Answer selection (radio/checkbox)
- Immediate feedback (green/red)
- Progress tracking
- Session summary
- Updates review metadata

## Styling Patterns

### Tailwind Classes

**Spacing**:
```tsx
<div className="space-y-4">  // Vertical spacing
<div className="gap-2">      // Gap in flex/grid
<div className="p-4">        // Padding
<div className="mb-6">       // Margin bottom
```

**Colors**:
```tsx
className="text-foreground"              // Main text
className="text-muted-foreground"        // Secondary text
className="bg-background"                // Background
className="border-border"                // Borders
```

**Dark Mode**:
```tsx
className="bg-white dark:bg-gray-950"    // Background
className="text-gray-900 dark:text-gray-100"  // Text
```

**Responsive**:
```tsx
className="grid-cols-1 md:grid-cols-3"  // Mobile → Desktop
className="hidden sm:inline"             // Hide on mobile
```

### Component Composition

**Prefer composition over props**:
```tsx
// Good
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>

// Avoid
<Card title="Title" content="Content" />
```

## Testing Components

### Manual Testing

```bash
# Start dev server
npm run dev

# Test in browser
# - Light and dark modes
# - Mobile and desktop
# - All interactive features
```

### Type Checking

```bash
# Check component types
npm run type-check
```

### Linting

```bash
# Check code quality
npm run lint
```

## Common Patterns

### Loading States

```typescript
const [loading, setLoading] = useState(true);

if (loading) {
  return <p>Loading...</p>;
}
```

### Error Handling

```typescript
const [error, setError] = useState<string | null>(null);

{error && (
  <Alert variant="destructive">
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}
```

### LocalStorage Integration

```typescript
import { LocalStorageAdapter, STORAGE_KEYS } from '@/lib/storage/local-storage';

const storage = new LocalStorageAdapter<MyType>(STORAGE_KEYS.MY_KEY);

// Get
const data = storage.get();

// Set
storage.set(newData);
```

---

**For build commands and project setup**, see root `AGENTS.md`.

**For detailed styling**, see `docs/TAILWIND_V4.md` and `docs/SHADCN.md`.
