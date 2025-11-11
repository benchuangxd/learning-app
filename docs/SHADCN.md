# ShadCN UI Reference

## Overview

ShadCN UI is a collection of re-usable components built with Radix UI and Tailwind CSS. Components are added to your project via CLI (not npm package).

## Initialization

```bash
npx shadcn@latest init
```

### Configuration Prompts

- **Style**: Default (or New York)
- **Base color**: Slate (or other options)
- **CSS variables**: Yes
- **TypeScript**: Yes
- **Import alias - components**: `@/components`
- **Import alias - utils**: `@/lib/utils`
- **React Server Components**: Yes
- **Tailwind config**: (leave empty for V4)
- **Global CSS**: `app/globals.css`

## Adding Components

Use the CLI to add components (NEVER copy-paste from website):

```bash
# Add a single component
npx shadcn@latest add button

# Add multiple components
npx shadcn@latest add button card dialog

# Add all components (not recommended)
npx shadcn@latest add --all
```

## Component Installation Patterns

### Forms

```bash
npx shadcn@latest add form input textarea select checkbox radio-group switch
```

### Overlays

```bash
npx shadcn@latest add dialog sheet popover tooltip dropdown-menu
```

### Data Display

```bash
npx shadcn@latest add table card badge separator
```

### Navigation

```bash
npx shadcn@latest add navigation-menu tabs breadcrumb pagination
```

### Feedback

```bash
npx shadcn@latest add alert toast progress skeleton
```

## Component Structure

After adding, components appear in:

```
components/
  ui/
    button.tsx
    card.tsx
    dialog.tsx
    ...
```

## Customization

### Option 1: Modify Component File

Edit the component directly in `components/ui/`:

```typescript
// components/ui/button.tsx
const buttonVariants = cva('...', {
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      destructive: 'bg-destructive text-destructive-foreground',
      // Add your custom variant
      custom: 'bg-purple-500 text-white hover:bg-purple-600',
    },
  },
});
```

### Option 2: Extend via Props

```typescript
<Button variant="default" className="custom-class">
  Click me
</Button>
```

## Common Components

### Button

```typescript
import { Button } from "@/components/ui/button"

<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

### Card

```typescript
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
  <CardFooter>
    Footer
  </CardFooter>
</Card>
```

### Dialog

```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

### Form (with react-hook-form)

```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const formSchema = z.object({
  username: z.string().min(2).max(50),
})

export function MyForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
```

## CLI Options

### Add Component

```bash
npx shadcn@latest add [component]
```

### Add Component with Overwrite

```bash
npx shadcn@latest add button --overwrite
```

### Add Component from URL (Custom Registry)

```bash
npx shadcn@latest add https://example.com/r/custom-component.json
```

### Add to Specific Path

```bash
npx shadcn@latest add button --path components/custom
```

### Skip Confirmation

```bash
npx shadcn@latest add button --yes
```

## Utilities

### cn() Helper

All components use the `cn()` helper from `lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Usage:

```typescript
<div className={cn("base-class", condition && "conditional-class", className)}>
```

## Best Practices

1. **Always use CLI**: Never copy components from website
2. **Customize in place**: Edit component files directly for project-wide changes
3. **Compose components**: Build complex UIs by composing primitives
4. **Use TypeScript**: All components are fully typed
5. **Accessibility**: Components are accessible by default (ARIA labels included)
6. **Server Components**: Most components work as React Server Components
7. **Client Components**: Add `'use client'` only when needed (interactive components)

## Client vs Server Components

### Client Components (need 'use client')

- Dialog
- DropdownMenu
- Sheet
- Toast
- Form (with react-hook-form)

### Server Components (default)

- Card
- Badge
- Separator
- Typography components

## Theming

Components use CSS variables for theming (defined in `globals.css`):

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    /* ... */
  }

  [data-theme='dark'] {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... */
  }
}
```

## Common Issues

### Issue: Component not found

**Solution**: Run `npx shadcn@latest add [component]` to add it

### Issue: Styling conflicts

**Solution**: Use `cn()` helper to merge classes properly

### Issue: Client component errors

**Solution**: Add `'use client'` directive at top of file

### Issue: Type errors

**Solution**: Ensure TypeScript is strict mode compatible

## Resources

- Official Docs: https://ui.shadcn.com
- Components: https://ui.shadcn.com/docs/components
- GitHub: https://github.com/shadcn-ui/ui
- Examples: https://ui.shadcn.com/examples
