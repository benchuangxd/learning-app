# Learning App - Linear Tickets Plan

## Project Overview

A spaced repetition learning application built with Next.js 15, Tailwind CSS V4, and ShadCN UI. The app allows users to learn from repeating questions with answers and explanations, all stored locally in the browser (no backend needed).

## Tech Stack

- **Framework**: Next.js 15 (App Router with React 19)
- **Styling**: Tailwind CSS V4 (CSS-first configuration)
- **UI Components**: ShadCN UI (CLI-based)
- **Language**: TypeScript (strict mode, zero `any` types)
- **Storage**: Local Storage / IndexedDB
- **Development**: Turbopack (default in Next.js 15)

---

## Epic 1: Project Setup & Infrastructure

### Ticket 1.1: Initialize Next.js 15 Project with TypeScript

**Priority**: High  
**Labels**: setup, infrastructure  
**Estimate**: 1 point

**Description**:
Set up a new Next.js 15 project with TypeScript, App Router, and Turbopack enabled by default.

**Acceptance Criteria**:

- [ ] Next.js 15 project created with `create-next-app@latest`
- [ ] TypeScript configured with strict mode enabled
- [ ] App Router structure in place
- [ ] Turbopack running in dev mode
- [ ] Project runs successfully with `npm run dev`
- [ ] No compilation errors

**Technical Details**:

```bash
npx create-next-app@latest learning-app --typescript --app --no-src-dir --turbopack
```

**Configuration Requirements**:

- Use App Router (not Pages Router)
- Enable Turbopack by default
- No `src/` directory (keep `app/` at root)
- Use default import alias `@/`

---

### Ticket 1.2: Configure TypeScript for Strict Type Safety

**Priority**: High  
**Labels**: setup, typescript, type-safety  
**Estimate**: 2 points

**Description**:
Configure TypeScript with strict compiler options to ensure zero `any` types and full type safety across the codebase.

**Acceptance Criteria**:

- [ ] `tsconfig.json` configured with strict mode
- [ ] All strict options enabled (noImplicitAny, strictNullChecks, etc.)
- [ ] ESLint rule for no explicit any enabled
- [ ] TypeScript type checking passes with zero errors
- [ ] No `@ts-ignore` or `@ts-expect-error` comments

**TypeScript Configuration** (`tsconfig.json`):

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "allowJs": false
  }
}
```

**ESLint Rules**:

```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-return": "error"
  }
}
```

---

### Ticket 1.3: Install and Configure Tailwind CSS V4

**Priority**: High  
**Labels**: setup, styling, tailwind  
**Estimate**: 2 points

**Description**:
Install and configure Tailwind CSS V4 with its new CSS-first configuration approach (no `tailwind.config.js`).

**Acceptance Criteria**:

- [ ] Tailwind CSS V4 installed
- [ ] PostCSS configured with `@tailwindcss/postcss` plugin
- [ ] CSS-first configuration in `app/globals.css`
- [ ] Theme variables defined using `@theme` directive
- [ ] Tailwind classes working in components
- [ ] Dark mode support configured

**Installation**:

```bash
npm install tailwindcss@next @tailwindcss/postcss@next
```

**PostCSS Configuration** (`postcss.config.mjs`):

```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

**Global CSS Configuration** (`app/globals.css`):

```css
@import 'tailwindcss';

@theme {
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;
  --color-success: #10b981;
  --color-error: #ef4444;
  --color-warning: #f59e0b;

  --font-sans: 'Inter', system-ui, sans-serif;
}

@layer base {
  :root {
    color-scheme: light;
  }

  [data-theme='dark'] {
    color-scheme: dark;
  }
}
```

**Reference**: See `docs/TAILWIND_V4.md` for complete Tailwind V4 migration guide.

---

### Ticket 1.4: Initialize ShadCN UI Configuration

**Priority**: High  
**Labels**: setup, ui, shadcn  
**Estimate**: 2 points

**Description**:
Initialize ShadCN UI using the CLI and configure the component registry for the project.

**Acceptance Criteria**:

- [ ] ShadCN UI initialized with `shadcn init`
- [ ] `components.json` properly configured
- [ ] `lib/utils.ts` with `cn()` helper created
- [ ] Base styles configured for ShadCN
- [ ] Successfully add a test component (button)

**Initialization**:

```bash
npx shadcn@latest init
```

**Configuration Selections**:

- Style: Default
- Base color: Slate
- CSS variables: Yes
- TypeScript: Yes
- Import alias for components: `@/components`
- Import alias for utils: `@/lib/utils`
- React Server Components: Yes
- Tailwind config: (leave empty for V4)
- Global CSS file: `app/globals.css`

**Test Installation**:

```bash
npx shadcn@latest add button
```

**Reference**: See `docs/SHADCN.md` for ShadCN CLI usage patterns.

---

### Ticket 1.5: Create Root AGENTS.md

**Priority**: High  
**Labels**: documentation, agents-md  
**Estimate**: 2 points

**Description**:
Create the root `AGENTS.md` file that provides AI coding agents with essential project context, build commands, and conventions.

**Acceptance Criteria**:

- [ ] `AGENTS.md` file created at project root
- [ ] File is under 150 lines (Factory recommendation)
- [ ] Contains build & test commands
- [ ] Documents project structure
- [ ] References external documentation files
- [ ] Includes conventions and patterns
- [ ] Git workflow documented

**Content Structure**:

```markdown
# Learning App

## Core Commands

- Build: `npm run build`
- Dev: `npm run dev`
- Type check: `npm run type-check`
- Lint: `npm run lint`
- Format: `npm run format`
- Test: `npm test`

## Project Layout

app/ → Next.js App Router
components/ → Reusable React components
ui/ → ShadCN UI components
lib/ → Utilities and helpers
docs/ → Reference documentation

## Development Patterns

- TypeScript strict mode (zero `any` types)
- Use ShadCN CLI for UI components: `npx shadcn@latest add [component]`
- Tailwind V4 CSS-first configuration (see docs/TAILWIND_V4.md)
- Client components marked with 'use client'
- See docs/CONVENTIONS.md for detailed coding standards

## Reference Documentation

- Tailwind V4: docs/TAILWIND_V4.md
- ShadCN Usage: docs/SHADCN.md
- TypeScript: docs/TYPESCRIPT.md
- Conventions: docs/CONVENTIONS.md
```

**Reference**: Follow Factory AGENTS.md best practices from https://docs.factory.ai/cli/configuration/agents-md

---

### Ticket 1.6: Create Reference Documentation Files

**Priority**: High  
**Labels**: documentation  
**Estimate**: 3 points

**Description**:
Create modular reference documentation files (each under 250 lines) that AGENTS.md can reference, covering Tailwind V4, ShadCN, TypeScript, and conventions.

**Acceptance Criteria**:

- [ ] `docs/TAILWIND_V4.md` created (< 250 lines)
- [ ] `docs/SHADCN.md` created (< 250 lines)
- [ ] `docs/TYPESCRIPT.md` created (< 250 lines)
- [ ] `docs/CONVENTIONS.md` created (< 250 lines)
- [ ] All files have clear, actionable information
- [ ] Cross-references between docs where appropriate

**Files to Create**:

1. **docs/TAILWIND_V4.md**: Tailwind V4 CSS-first configuration, theme syntax, migration from V3
2. **docs/SHADCN.md**: ShadCN CLI commands, component installation patterns, customization
3. **docs/TYPESCRIPT.md**: Strict mode configuration, type safety patterns, common utilities
4. **docs/CONVENTIONS.md**: Naming conventions, file structure, component patterns, git workflow

---

### Ticket 1.7: Set Up ESLint and Prettier

**Priority**: Medium  
**Labels**: setup, tooling, code-quality  
**Estimate**: 2 points

**Description**:
Configure ESLint with TypeScript rules and Prettier for consistent code formatting across the project.

**Acceptance Criteria**:

- [ ] ESLint configured with Next.js and TypeScript plugins
- [ ] Prettier configured and integrated with ESLint
- [ ] No conflicts between ESLint and Prettier
- [ ] `npm run lint` passes with no errors
- [ ] `npm run format` formats code correctly
- [ ] Pre-commit hooks optional (not required)

**ESLint Configuration** (`.eslintrc.json`):

```json
{
  "extends": ["next/core-web-vitals", "@typescript-eslint/recommended", "prettier"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

**Prettier Configuration** (`.prettierrc`):

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 100
}
```

---

## Epic 2: Core Data Models & Storage

### Ticket 2.1: Define TypeScript Interfaces for Question Model

**Priority**: High  
**Labels**: feature, types, data-model  
**Estimate**: 2 points

**Description**:
Define comprehensive TypeScript interfaces for the question data model with full type safety.

**Acceptance Criteria**:

- [ ] `types/question.ts` file created
- [ ] Question interface defined with all fields
- [ ] QuestionChoice interface defined
- [ ] QuestionDifficulty enum created
- [ ] QuestionCategory interface defined
- [ ] Zero `any` types used
- [ ] All interfaces exported
- [ ] JSDoc comments for each interface

**Type Definitions**:

```typescript
// types/question.ts
export enum QuestionDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export interface QuestionChoice {
  id: string;
  label: string; // A, B, C, D
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  text: string;
  points: number;
  difficulty: QuestionDifficulty;
  choices: QuestionChoice[];
  explanation: string;
  category?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionAttempt {
  questionId: string;
  selectedChoiceId: string;
  isCorrect: boolean;
  timestamp: Date;
}

export interface StudySession {
  id: string;
  startTime: Date;
  endTime?: Date;
  attempts: QuestionAttempt[];
  score: number;
}
```

---

### Ticket 2.2: Implement LocalStorage Adapter with Type Safety

**Priority**: High  
**Labels**: feature, storage, typescript  
**Estimate**: 3 points

**Description**:
Create a type-safe LocalStorage adapter for persisting questions and study sessions with full error handling.

**Acceptance Criteria**:

- [ ] `lib/storage/local-storage.ts` created
- [ ] Type-safe get/set methods implemented
- [ ] Error handling for quota exceeded
- [ ] Serialization/deserialization with type guards
- [ ] Clear/remove methods implemented
- [ ] All methods have proper TypeScript return types
- [ ] Unit tests pass (optional for MVP)

**Implementation**:

```typescript
// lib/storage/local-storage.ts
export class LocalStorageAdapter<T> {
  constructor(private key: string) {}

  get(): T | null {
    try {
      const item = localStorage.getItem(this.key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  set(value: T): boolean {
    try {
      localStorage.setItem(this.key, JSON.stringify(value));
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded');
      }
      return false;
    }
  }

  remove(): void {
    localStorage.removeItem(this.key);
  }

  clear(): void {
    localStorage.clear();
  }
}
```

---

### Ticket 2.3: Create Question Parser for Import Format

**Priority**: High  
**Labels**: feature, parser, data-processing  
**Estimate**: 3 points

**Description**:
Build a parser that converts the markdown-like question format into typed Question objects.

**Acceptance Criteria**:

- [ ] `lib/parsers/question-parser.ts` created
- [ ] Regex patterns for parsing question format
- [ ] Error handling for malformed input
- [ ] Returns typed Question objects
- [ ] Handles multi-line explanations
- [ ] Validates choice format (A-D)
- [ ] Identifies correct answer (✅)
- [ ] Zero `any` types in implementation

**Input Format Example**:

```
**Question 1 (1 point)**
Which of the following best defines an Embedded System (ES)?
A. A system that only uses analogue electronics.
B. A general-purpose computer for various tasks.
C. A standalone software application.
D. A computing system dedicated to a specific task within a larger electrical system. ✅
— Embedded systems are specialized computing systems designed for one dedicated purpose, typically integrated into a larger device (e.g., washing machines, pacemakers, cars)
```

**Parser Interface**:

```typescript
export interface ParseResult {
  questions: Question[];
  errors: ParseError[];
}

export interface ParseError {
  line: number;
  message: string;
}

export function parseQuestions(input: string): ParseResult;
```

---

## Epic 3: Question Management UI

### Ticket 3.1: Create Question Import Component

**Priority**: High  
**Labels**: feature, ui, component  
**Estimate**: 5 points

**Description**:
Build a component for importing questions via textarea with live preview and validation.

**Acceptance Criteria**:

- [ ] Import form with textarea component
- [ ] Real-time parsing and preview
- [ ] Error display for malformed questions
- [ ] Success message on import
- [ ] Questions saved to LocalStorage
- [ ] Clear/reset functionality
- [ ] Loading states during parsing
- [ ] Responsive design

**ShadCN Components Needed**:

```bash
npx shadcn@latest add textarea
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add alert
npx shadcn@latest add badge
```

**Component Structure**:

```typescript
// components/questions/question-import.tsx
'use client';

export function QuestionImport() {
  // Implementation
}
```

---

### Ticket 3.2: Create Question List View Component

**Priority**: High  
**Labels**: feature, ui, component  
**Estimate**: 3 points

**Description**:
Build a component to display all imported questions with filtering and search capabilities.

**Acceptance Criteria**:

- [ ] List displays all questions
- [ ] Search functionality by question text
- [ ] Filter by difficulty
- [ ] Filter by category
- [ ] Sort options (date, difficulty, points)
- [ ] Empty state when no questions
- [ ] Loading skeleton during data fetch

**ShadCN Components Needed**:

```bash
npx shadcn@latest add input
npx shadcn@latest add select
npx shadcn@latest add skeleton
npx shadcn@latest add table
```

---

### Ticket 3.3: Create Question Card Component

**Priority**: Medium  
**Labels**: feature, ui, component  
**Estimate**: 3 points

**Description**:
Build a reusable question card component for displaying individual questions with their choices and metadata.

**Acceptance Criteria**:

- [ ] Displays question text and points
- [ ] Shows all choices (A-D)
- [ ] Highlights correct answer when revealed
- [ ] Shows explanation on expand
- [ ] Edit and delete actions
- [ ] Responsive design
- [ ] Accessibility (ARIA labels)

**ShadCN Components Needed**:

```bash
npx shadcn@latest add card
npx shadcn@latest add badge
npx shadcn@latest add button
npx shadcn@latest add collapsible
```

---

### Ticket 3.4: Create Question Edit Dialog

**Priority**: Medium  
**Labels**: feature, ui, component  
**Estimate**: 4 points

**Description**:
Build a dialog component for editing existing questions with form validation.

**Acceptance Criteria**:

- [ ] Dialog with form fields for all question properties
- [ ] Choice editor with add/remove functionality
- [ ] Correct answer selector
- [ ] Form validation using react-hook-form
- [ ] Save updates to LocalStorage
- [ ] Cancel and discard changes
- [ ] Loading state during save

**ShadCN Components Needed**:

```bash
npx shadcn@latest add dialog
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add textarea
npx shadcn@latest add radio-group
```

---

## Epic 4: Study Session & Spaced Repetition

### Ticket 4.1: Implement Spaced Repetition Algorithm

**Priority**: High  
**Labels**: feature, algorithm, core-logic  
**Estimate**: 5 points

**Description**:
Implement a spaced repetition algorithm (simplified SM-2) to determine which questions to show based on user performance.

**Acceptance Criteria**:

- [ ] Algorithm implementation in `lib/algorithms/spaced-repetition.ts`
- [ ] Question scheduling based on correctness
- [ ] Difficulty multiplier affects review intervals
- [ ] Type-safe implementation
- [ ] Due date calculation logic
- [ ] Priority scoring for overdue questions
- [ ] Zero dependencies (pure TypeScript)

**Algorithm Interface**:

```typescript
export interface ReviewMetadata {
  questionId: string;
  easinessFactor: number; // 1.3 - 2.5
  interval: number; // days
  repetitions: number;
  nextReviewDate: Date;
}

export function calculateNextReview(
  metadata: ReviewMetadata,
  quality: number // 0-5 (0=fail, 5=perfect)
): ReviewMetadata;

export function getQuestionsForReview(
  questions: Question[],
  metadata: ReviewMetadata[]
): Question[];
```

---

### Ticket 4.2: Create Study Session Component

**Priority**: High  
**Labels**: feature, ui, component  
**Estimate**: 5 points

**Description**:
Build the main study session component where users answer questions with immediate feedback.

**Acceptance Criteria**:

- [ ] Question display with choices
- [ ] Single-choice selection (radio buttons)
- [ ] Submit answer button
- [ ] Immediate feedback (correct/incorrect)
- [ ] Show explanation after answering
- [ ] Next question button
- [ ] Progress tracker (X of Y questions)
- [ ] Session timer
- [ ] Keyboard shortcuts (1-4 for choices, Enter to submit)

**ShadCN Components Needed**:

```bash
npx shadcn@latest add radio-group
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add progress
npx shadcn@latest add alert
```

---

### Ticket 4.3: Create Session Summary Component

**Priority**: Medium  
**Labels**: feature, ui, component  
**Estimate**: 3 points

**Description**:
Build a summary screen shown at the end of each study session with statistics and performance metrics.

**Acceptance Criteria**:

- [ ] Total questions answered
- [ ] Correct/incorrect breakdown
- [ ] Score percentage
- [ ] Time spent
- [ ] Chart visualization (optional)
- [ ] Review incorrect questions button
- [ ] Start new session button
- [ ] Share results (optional)

**ShadCN Components Needed**:

```bash
npx shadcn@latest add card
npx shadcn@latest add button
npx shadcn@latest add separator
```

---

### Ticket 4.4: Implement Session State Management

**Priority**: High  
**Labels**: feature, state-management  
**Estimate**: 3 points

**Description**:
Implement React Context or Zustand store for managing study session state across components.

**Acceptance Criteria**:

- [ ] Session state includes current question, attempts, score
- [ ] State persisted to LocalStorage on changes
- [ ] State restored on page refresh
- [ ] Type-safe state and actions
- [ ] No prop drilling
- [ ] Clean component integration

**State Interface**:

```typescript
export interface SessionState {
  id: string;
  questions: Question[];
  currentIndex: number;
  attempts: QuestionAttempt[];
  startTime: Date;
  isActive: boolean;
  isComplete: boolean;
}

export interface SessionActions {
  startSession: (questions: Question[]) => void;
  submitAnswer: (choiceId: string) => void;
  nextQuestion: () => void;
  endSession: () => void;
}
```

---

## Epic 5: Statistics & Progress Tracking

### Ticket 5.1: Create Statistics Calculator

**Priority**: Medium  
**Labels**: feature, statistics  
**Estimate**: 3 points

**Description**:
Implement a statistics calculator that computes various metrics from study session history.

**Acceptance Criteria**:

- [ ] Calculate overall accuracy percentage
- [ ] Calculate accuracy by difficulty
- [ ] Calculate accuracy by category
- [ ] Streak tracking (consecutive correct days)
- [ ] Total study time
- [ ] Questions per session averages
- [ ] Type-safe calculations
- [ ] Handle edge cases (division by zero)

**Statistics Interface**:

```typescript
export interface Statistics {
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  accuracyByDifficulty: Record<QuestionDifficulty, number>;
  accuracyByCategory: Record<string, number>;
  streak: number;
  totalStudyTime: number; // minutes
  sessionsCompleted: number;
}

export function calculateStatistics(sessions: StudySession[]): Statistics;
```

---

### Ticket 5.2: Create Statistics Dashboard Component

**Priority**: Medium  
**Labels**: feature, ui, component  
**Estimate**: 4 points

**Description**:
Build a dashboard component displaying user statistics and progress over time.

**Acceptance Criteria**:

- [ ] Overview cards with key metrics
- [ ] Accuracy by difficulty chart
- [ ] Study streak calendar/heatmap
- [ ] Recent sessions list
- [ ] Time period selector (week/month/all-time)
- [ ] Responsive layout
- [ ] Empty state for no data

**ShadCN Components Needed**:

```bash
npx shadcn@latest add card
npx shadcn@latest add tabs
npx shadcn@latest add calendar
npx shadcn@latest add select
```

---

## Epic 6: Layout & Navigation

### Ticket 6.1: Create Root Layout with Navigation

**Priority**: High  
**Labels**: feature, ui, layout  
**Estimate**: 3 points

**Description**:
Create the root layout component with navigation menu and responsive header.

**Acceptance Criteria**:

- [ ] Navigation bar with logo
- [ ] Links to Home, Study, Questions, Statistics
- [ ] Mobile responsive menu
- [ ] Dark mode toggle
- [ ] Active route highlighting
- [ ] Footer component
- [ ] Accessibility (keyboard navigation)

**ShadCN Components Needed**:

```bash
npx shadcn@latest add navigation-menu
npx shadcn@latest add dropdown-menu
npx shadcn@latest add sheet
npx shadcn@latest add switch
```

---

### Ticket 6.2: Implement Dark Mode Support

**Priority**: Medium  
**Labels**: feature, ui, theme  
**Estimate**: 2 points

**Description**:
Implement dark mode support using Tailwind V4's dark mode classes and next-themes.

**Acceptance Criteria**:

- [ ] `next-themes` installed and configured
- [ ] Dark mode toggle in header
- [ ] Theme persisted to LocalStorage
- [ ] All components support dark mode
- [ ] System preference detection
- [ ] Smooth transition animations

**Implementation**:

```bash
npm install next-themes
```

**Tailwind Dark Mode** (in `app/globals.css`):

```css
@layer base {
  [data-theme='dark'] {
    --color-primary: #60a5fa;
    /* Override other theme colors */
  }
}
```

---

### Ticket 6.3: Create Home/Landing Page

**Priority**: Medium  
**Labels**: feature, ui, page  
**Estimate**: 3 points

**Description**:
Create the home page with quick actions and overview of study progress.

**Acceptance Criteria**:

- [ ] Hero section with app description
- [ ] Quick start button (start study session)
- [ ] Import questions button
- [ ] Recent statistics summary
- [ ] Next questions due preview
- [ ] Responsive design
- [ ] Call-to-action buttons

**ShadCN Components Needed**:

```bash
npx shadcn@latest add button
npx shadcn@latest add card
```

---

## Epic 7: Type Safety & Code Quality

### Ticket 7.1: Run droid-exec to Fix Lint Errors

**Priority**: High  
**Labels**: quality, lint, automation  
**Estimate**: 3 points

**Description**:
Use Factory's droid-exec to automatically fix any remaining lint errors and ensure zero lint warnings.

**Acceptance Criteria**:

- [ ] `npm run lint` shows zero errors
- [ ] `npm run lint` shows zero warnings
- [ ] All auto-fixable issues resolved
- [ ] Manual review of changes completed
- [ ] Code still functions correctly after fixes

**Command**:

```bash
# Review lint errors first
npm run lint

# Use droid-exec for automated fixes
droid exec --auto low "Fix all ESLint errors and warnings in the codebase"
```

**Reference**: https://docs.factory.ai/cli/droid-exec/cookbook/refactor-fix-lint

---

### Ticket 7.2: Audit TypeScript for Zero `any` Types

**Priority**: High  
**Labels**: quality, typescript, type-safety  
**Estimate**: 3 points

**Description**:
Audit the entire codebase to ensure zero `any` types and full type safety everywhere.

**Acceptance Criteria**:

- [ ] Search for all `any` types in codebase
- [ ] Replace `any` with proper types or `unknown`
- [ ] Type guards implemented where needed
- [ ] No `@ts-ignore` or `@ts-expect-error` comments
- [ ] `npm run type-check` passes with zero errors
- [ ] ESLint rule enforces no explicit any

**Audit Commands**:

```bash
# Find all 'any' types
grep -r "any" --include="*.ts" --include="*.tsx" app/ components/ lib/

# Run type check
npm run type-check
```

---

### Ticket 7.3: Audit and Update All Dependencies

**Priority**: High  
**Labels**: quality, dependencies, maintenance  
**Estimate**: 2 points

**Description**:
Audit all npm dependencies to ensure latest versions with zero deprecated packages.

**Acceptance Criteria**:

- [ ] All dependencies updated to latest stable versions
- [ ] Zero deprecated dependencies
- [ ] `npm audit` shows zero vulnerabilities
- [ ] All packages compatible with each other
- [ ] Project still builds and runs successfully
- [ ] Tests still pass (if any)

**Commands**:

```bash
# Check for outdated packages
npm outdated

# Check for deprecated packages
npm ls --depth=0

# Update all to latest
npm update --save

# Check for vulnerabilities
npm audit
npm audit fix
```

---

## Epic 8: Testing & Deployment Preparation

### Ticket 8.1: Add Component AGENTS.md Files

**Priority**: Medium  
**Labels**: documentation, agents-md  
**Estimate**: 3 points

**Description**:
Create component-specific AGENTS.md files in relevant directories (components/, lib/, app/) that are under 150 lines and reference root docs.

**Acceptance Criteria**:

- [ ] `components/AGENTS.md` created (< 150 lines)
- [ ] `lib/AGENTS.md` created (< 150 lines)
- [ ] Each file references root docs when needed
- [ ] Component patterns documented
- [ ] Testing commands documented
- [ ] No duplicate content from root AGENTS.md

**Example** (`components/AGENTS.md`):

```markdown
# Components

## UI Component Patterns

- Use ShadCN CLI to add components (see /docs/SHADCN.md)
- All client components must have 'use client' directive
- Follow atomic design: atoms → molecules → organisms

## ShadCN Components

- Install: `npx shadcn@latest add [component]`
- Customize in `components/ui/`
- Keep customizations minimal

## Testing

- Component tests: `npm test -- components/`
- Visual tests: `npm run storybook` (if implemented)

See root AGENTS.md for build commands.
```

---

### Ticket 8.2: Create README.md

**Priority**: Medium  
**Labels**: documentation  
**Estimate**: 2 points

**Description**:
Create a comprehensive README.md for human developers (separate from AGENTS.md).

**Acceptance Criteria**:

- [ ] Project description and features
- [ ] Tech stack listed
- [ ] Installation instructions
- [ ] Usage guide with screenshots
- [ ] Development commands
- [ ] Contributing guidelines (optional)
- [ ] License information

---

### Ticket 8.3: Build Production Bundle and Verify

**Priority**: High  
**Labels**: deployment, build  
**Estimate**: 2 points

**Description**:
Build the production bundle and verify it works correctly with no errors or warnings.

**Acceptance Criteria**:

- [ ] `npm run build` completes successfully
- [ ] Zero build errors
- [ ] Zero TypeScript errors
- [ ] Zero lint errors
- [ ] Bundle size is reasonable (< 1MB)
- [ ] Production build runs with `npm start`
- [ ] All features work in production mode

**Commands**:

```bash
npm run build
npm start
```

---

## Epic 9: Optional Enhancements

### Ticket 9.1: Add Question Categories Management

**Priority**: Low  
**Labels**: enhancement, feature  
**Estimate**: 3 points

**Description**:
Allow users to organize questions into custom categories for better organization.

---

### Ticket 9.2: Add Export Functionality

**Priority**: Low  
**Labels**: enhancement, feature  
**Estimate**: 2 points

**Description**:
Allow users to export their questions and study history to JSON format.

---

### Ticket 9.3: Add Keyboard Shortcuts Help Dialog

**Priority**: Low  
**Labels**: enhancement, accessibility  
**Estimate**: 2 points

**Description**:
Create a help dialog showing all available keyboard shortcuts for power users.

---

## Summary

**Total Tickets**: 37 main tickets (26 high priority, 7 medium priority, 4 low priority)

**Estimated Points**: ~105 points total

**Recommended Development Order**:

1. Complete Epic 1 (Project Setup) first - foundation
2. Complete Epic 2 (Data Models) - core logic
3. Build Epic 3 (Question Management) - basic functionality
4. Implement Epic 4 (Study Session) - core feature
5. Add Epic 6 (Layout) - user experience
6. Complete Epic 7 (Type Safety) - quality assurance
7. Finish Epic 5 (Statistics) - analytics
8. Prepare Epic 8 (Deployment) - production ready
9. Optionally add Epic 9 features - enhancements

---

## Linear Best Practices Applied

1. **Clear Requirements**: Each ticket has explicit acceptance criteria
2. **Consistent Labeling**: All tickets use standard labels (setup, feature, ui, etc.)
3. **Structured Format**: Title → Priority → Labels → Estimate → Description → Acceptance Criteria → Technical Details
4. **Linked Context**: Tickets reference docs and provide code examples
5. **Testable Outcomes**: Clear verification steps for each ticket
6. **Dependency Tracking**: Epics show natural progression
7. **Estimates**: Story points for planning (Fibonacci: 1, 2, 3, 5, 8)
8. **Technical Depth**: Includes commands, configurations, and implementation hints

---

## Notes

- All tickets follow Linear best practices for issue tracking
- No local TODO files - everything should be in Linear
- AGENTS.md files reference external docs to stay under line limits
- TypeScript strict mode enforced throughout
- Tailwind V4 CSS-first approach used
- ShadCN CLI-only approach (no manual component copying)
- Zero backend - everything client-side with LocalStorage
- Production-ready with full type safety

**Next Steps**: Import these tickets into Linear and begin development with Epic 1.
