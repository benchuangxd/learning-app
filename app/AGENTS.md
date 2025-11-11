# App Directory

Next.js App Router pages and routes for the Learning App.

## Directory Structure

```
app/
├── layout.tsx           → Root layout (navbar, theme provider)
├── page.tsx             → Home page
├── globals.css          → Global styles (Tailwind V4)
├── questions/
│   └── page.tsx         → Question management page
├── study/
│   └── page.tsx         → Study session page
└── statistics/
    └── page.tsx         → Statistics dashboard
```

## Page Conventions

### File Names

- **page.tsx**: Route page component
- **layout.tsx**: Shared layout for route segment
- **loading.tsx**: Loading UI (optional)
- **error.tsx**: Error boundary (optional)
- **not-found.tsx**: 404 page (optional)

### Client vs Server

**All our pages use 'use client'** because:
- Need LocalStorage access
- Interactive with state management
- Use React hooks (useState, useEffect)

### Page Structure

**Standard pattern**:
```typescript
'use client';

import { useState, useEffect } from 'react';
// ... imports

export default function PageName(): React.ReactElement {
  const [data, setData] = useState<DataType[]>([]);
  
  useEffect(() => {
    // Load data
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1>Page Title</h1>
        {/* Content */}
      </div>
    </div>
  );
}
```

## Page Layouts

### Container Pattern

**All pages use**:
```tsx
<div className="container mx-auto py-8 px-4">
  <div className="max-w-4xl mx-auto">
    {/* Content */}
  </div>
</div>
```

**Why**:
- Consistent spacing
- Responsive padding
- Centered content
- Max width for readability

### Page Headers

**Standard header**:
```tsx
<div className="mb-8">
  <h1 className="text-3xl font-bold mb-2">Page Title</h1>
  <p className="text-muted-foreground">Description</p>
</div>
```

## Routing

### Navigation

**Use Next.js Link**:
```tsx
import Link from 'next/link';

<Link href="/questions">
  <Button>Go to Questions</Button>
</Link>
```

**Routes**:
- `/` - Home page
- `/questions` - Question management
- `/study` - Study session
- `/statistics` - Progress tracking

## Global Styles

### Tailwind V4 Configuration

**In `app/globals.css`**:

```css
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
  /* Custom theme variables */
}
```

**See `docs/TAILWIND_V4.md`** for complete guide.

### Dark Mode

**Automatic** via `next-themes`:
- Theme controlled by ThemeProvider
- Use `dark:` prefix in Tailwind
- All pages support both themes

## Data Loading Pattern

### LocalStorage Access

**All pages follow**:
```typescript
const storage = new LocalStorageAdapter<T>(STORAGE_KEYS.KEY);

useEffect(() => {
  const data = storage.get();
  setData(data ?? []);
}, []);
```

**Why useEffect**:
- LocalStorage only available client-side
- Prevents SSR/hydration errors
- Runs after mount

### Cross-Tab Sync

**Listen for storage events**:
```typescript
useEffect(() => {
  const handleStorageChange = (e: StorageEvent): void => {
    if (e.key === STORAGE_KEYS.KEY) {
      loadData();
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);
```

## Page-Specific Notes

### Home Page (`page.tsx`)

- Loads questions to show stats
- Quick stats display (Total, Due, Mastered)
- Smart CTA button (only shows when questions due)
- Feature cards for navigation

### Questions Page (`questions/page.tsx`)

- Integrates QuestionImport and QuestionList
- Two-column layout on desktop
- Side-by-side import and list view

### Study Page (`study/page.tsx`)

- Three study modes (Due, All, Random)
- Statistics cards display
- Starts StudySession component
- Randomizes answer choices

### Statistics Page (`statistics/page.tsx`)

- Overview cards (4 metrics)
- Progress breakdown with bars
- Upcoming reviews list
- Calculates mastery percentage

## Performance

### No Performance Issues

Our app is small enough that:
- No code splitting needed (beyond Next.js default)
- No lazy loading required
- No memoization needed
- Fast by default

### If Scaling

**For > 1000 questions**:
- Consider IndexedDB instead of LocalStorage
- Add pagination to question list
- Virtualize long lists
- Lazy load statistics

---

**For component patterns**, see `components/AGENTS.md`.

**For lib utilities**, see `lib/AGENTS.md`.

**For build commands**, see root `AGENTS.md`.
