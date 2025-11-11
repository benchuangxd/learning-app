# Learning App

A spaced repetition learning application built with Next.js 15, Tailwind CSS V4, and ShadCN UI.

## Core Commands

- **Dev server**: `npm run dev` (Turbopack enabled by default)
- **Build**: `npm run build`
- **Start production**: `npm start`
- **Type check**: `npm run type-check`
- **Lint**: `npm run lint`
- **Format**: `npm run format`

## Project Layout

```
app/               → Next.js App Router (pages and routes)
components/        → React components
  ui/             → ShadCN UI components (CLI-installed)
lib/              → Utilities and helpers
  utils.ts        → Utility functions (cn helper)
types/            → TypeScript type definitions
docs/             → Reference documentation
planning/         → Project planning docs
scripts/          → Build and import scripts
```

## Development Patterns

### TypeScript

- **Strict mode enabled**: Zero `any` types allowed
- All functions must have explicit return types
- Use type guards for runtime validation
- See `docs/TYPESCRIPT.md` for detailed patterns

### ShadCN UI Components

- **Always use CLI**: `npx shadcn@latest add [component]`
- Never copy-paste from website
- Components installed to `components/ui/`
- See `docs/SHADCN.md` for usage patterns

### Tailwind CSS V4

- **CSS-first configuration**: No `tailwind.config.js`
- Theme customization in `app/globals.css` using `@theme` directive
- Dark mode via `data-theme="dark"` attribute
- See `docs/TAILWIND_V4.md` for migration guide

### Component Conventions

- Client components: Add `'use client'` directive at top
- Server components: Default (no directive needed)
- File naming: PascalCase for components (`QuestionCard.tsx`)
- Function naming: camelCase (`parseQuestions`)

## Reference Documentation

- **Tailwind V4**: `docs/TAILWIND_V4.md` - CSS-first config, theme setup
- **ShadCN UI**: `docs/SHADCN.md` - CLI commands, component patterns
- **TypeScript**: `docs/TYPESCRIPT.md` - Strict mode, type safety
- **Conventions**: `docs/CONVENTIONS.md` - Coding standards, file structure

## Key Technologies

- **Next.js 15**: App Router, React 19, Turbopack
- **Tailwind V4**: CSS-first configuration (major rewrite from V3)
- **ShadCN UI**: CLI-based components with Radix UI
- **TypeScript**: Strict mode with zero tolerance for `any`
- **Storage**: LocalStorage for client-side persistence

## Git Workflow

1. Branch naming: `feature/`, `fix/`, `refactor/`, `docs/`
2. Commit format: `type(scope): message`
   - Types: feat, fix, refactor, docs, style, test, chore
3. Always run `npm run lint` and `npm run type-check` before commits
4. Never commit with lint errors or type errors

## Quality Gates

Before considering any ticket "done":

- [ ] `npm run lint` - Zero errors
- [ ] `npm run type-check` - Zero errors
- [ ] Zero `any` types in new code
- [ ] All acceptance criteria met
- [ ] Code reviewed for type safety

## External Services

None - this is a fully client-side application using LocalStorage.

## Notes

- No backend required
- All data stored in browser LocalStorage
- Spaced repetition algorithm runs client-side
- Future: Consider IndexedDB for larger datasets

---

For detailed patterns and examples, see reference docs in `docs/` folder.
