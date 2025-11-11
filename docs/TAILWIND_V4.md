# Tailwind CSS V4 Reference

## Overview

Tailwind CSS V4 represents a complete rewrite with a CSS-first configuration approach. The `tailwind.config.js` file is no longer used. All configuration is done in CSS using the `@theme` directive.

## Installation

```bash
npm install tailwindcss@next @tailwindcss/postcss@next
```

## PostCSS Configuration

Create `postcss.config.mjs`:

```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

## CSS Configuration

In `app/globals.css`:

```css
@import 'tailwindcss';

@theme {
  /* Custom theme variables */
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;

  /* Font families */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'Fira Code', monospace;

  /* Spacing (optional overrides) */
  --spacing-huge: 6rem;

  /* Breakpoints (optional) */
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
}

@layer base {
  :root {
    color-scheme: light;
  }

  [data-theme='dark'] {
    color-scheme: dark;
    --color-primary: #60a5fa;
  }
}
```

## Key Changes from V3 to V4

### 1. No Config File

**Before (V3)**:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
      },
    },
  },
};
```

**After (V4)**:

```css
/* app/globals.css */
@theme {
  --color-primary: #3b82f6;
}
```

### 2. CSS Variables Instead of JS Objects

All customizations use CSS custom properties (`--variable-name`) instead of JavaScript objects.

### 3. Dark Mode

**V4 Approach**:

```css
@layer base {
  [data-theme='dark'] {
    --color-background: #1a1a1a;
    --color-foreground: #ffffff;
  }
}
```

Use `data-theme="dark"` attribute on HTML element.

### 4. Custom Utilities

```css
@layer utilities {
  .custom-utility {
    background: color-mix(in srgb, theme('colors.blue.500'), theme('colors.purple.500'));
  }
}
```

### 5. Plugin Configuration

If you need plugins, configure them in CSS:

```css
@import 'tailwindcss';
@import '@tailwindcss/typography';

@theme {
  /* your theme */
}
```

## Using Theme Values

Access theme values using `theme()` function:

```css
.my-class {
  color: theme('--color-primary');
  font-family: theme('--font-sans');
}
```

## Responsive Design

Breakpoints work the same as V3:

```html
<div className="text-sm md:text-base lg:text-lg">Responsive text</div>
```

## Dark Mode Classes

```html
<div className="bg-white dark:bg-gray-900">Content</div>
```

## Custom Variants

```css
@custom-variant hover-focus {
  &:is(:hover, :focus) {
    @slot;
  }
}
```

## Important Notes

- No `tailwind.config.js` or `tailwind.config.ts` needed
- All config in CSS using `@theme` directive
- CSS variables for dynamic theming
- Better performance with native CSS features
- Plugins installed via npm and imported in CSS

## Migration Checklist

- [ ] Remove `tailwind.config.js`
- [ ] Install V4 packages
- [ ] Update `postcss.config.mjs`
- [ ] Move theme config to CSS `@theme` block
- [ ] Update dark mode to use `data-theme="dark"`
- [ ] Convert custom utilities to CSS
- [ ] Test all components
- [ ] Verify build process

## Common Patterns

### Colors

```css
@theme {
  --color-brand-50: #f0f9ff;
  --color-brand-100: #e0f2fe;
  /* ... */
  --color-brand-900: #0c4a6e;
}
```

Use: `className="bg-brand-500 text-brand-50"`

### Fonts

```css
@theme {
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-serif: 'Merriweather', serif;
}
```

Use: `className="font-sans"`

### Spacing

```css
@theme {
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 1.5rem;
  --spacing-lg: 2rem;
  --spacing-xl: 3rem;
}
```

## Resources

- Official Docs: https://tailwindcss.com/docs/upgrade-guide
- V4 Blog Post: https://tailwindcss.com/blog/tailwindcss-v4
- GitHub Discussions: https://github.com/tailwindlabs/tailwindcss/discussions
