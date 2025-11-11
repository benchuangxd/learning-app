# TypeScript Reference

## Strict Mode Configuration

`tsconfig.json` must have strict settings enabled:

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

## Zero `any` Policy

**NEVER use `any` type**. Use these alternatives:

### Use `unknown` for Uncertain Types

```typescript
// ❌ Bad
function parse(data: any) {
  return data.value;
}

// ✅ Good
function parse(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: unknown }).value;
  }
  throw new Error('Invalid data');
}
```

### Use Generics for Flexible Types

```typescript
// ❌ Bad
function identity(arg: any): any {
  return arg;
}

// ✅ Good
function identity<T>(arg: T): T {
  return arg;
}
```

### Use Type Guards

```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

function processValue(value: unknown) {
  if (isString(value)) {
    // value is string here
    return value.toUpperCase();
  }
  if (isNumber(value)) {
    // value is number here
    return value.toFixed(2);
  }
}
```

## Type Safety Patterns

### Safe Object Access

```typescript
// ❌ Unsafe
const value = obj[key]; // Could be undefined

// ✅ Safe
const value = obj[key];
if (value !== undefined) {
  // Use value
}

// ✅ With optional chaining
const value = obj?.key?.nested;
```

### Safe Array Access (noUncheckedIndexedAccess)

```typescript
// ❌ Unsafe
const item = array[0]; // Could be undefined
item.doSomething(); // Error with strict mode

// ✅ Safe
const item = array[0];
if (item !== undefined) {
  item.doSomething();
}

// ✅ Or use optional chaining
array[0]?.doSomething();
```

### Handling Null/Undefined

```typescript
// ❌ Bad
function getName(user: User | null): string {
  return user.name; // Error
}

// ✅ Good
function getName(user: User | null): string {
  if (!user) {
    return 'Anonymous';
  }
  return user.name;
}

// ✅ With nullish coalescing
function getName(user: User | null): string {
  return user?.name ?? 'Anonymous';
}
```

### Return Type Annotations

Always annotate function return types:

```typescript
// ❌ Bad (implicit return type)
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ✅ Good
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

## Common Type Utilities

### Built-in Utilities

```typescript
// Partial - all properties optional
type PartialUser = Partial<User>;

// Required - all properties required
type RequiredUser = Required<PartialUser>;

// Pick - select specific properties
type UserPreview = Pick<User, 'id' | 'name'>;

// Omit - exclude specific properties
type UserWithoutPassword = Omit<User, 'password'>;

// Record - object with specific key/value types
type UserMap = Record<string, User>;

// NonNullable - exclude null and undefined
type ValidUser = NonNullable<User | null | undefined>;
```

### Custom Utilities

```typescript
// DeepPartial - make all nested properties optional
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// DeepReadonly - make all nested properties readonly
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
```

## Type Narrowing

### typeof Guards

```typescript
function process(value: string | number) {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  return value.toFixed(2);
}
```

### instanceof Guards

```typescript
function handleError(error: Error | string) {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }
}
```

### in Operator

```typescript
interface Circle {
  radius: number;
}

interface Square {
  sideLength: number;
}

function getArea(shape: Circle | Square): number {
  if ('radius' in shape) {
    return Math.PI * shape.radius ** 2;
  }
  return shape.sideLength ** 2;
}
```

### Custom Type Guards

```typescript
interface User {
  id: string;
  name: string;
}

function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof (value as User).id === 'string' &&
    'name' in value &&
    typeof (value as User).name === 'string'
  );
}
```

## Async/Promise Types

```typescript
// ❌ Bad
async function fetchUser(id: string) {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

// ✅ Good
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }
  const data: unknown = await response.json();
  if (!isUser(data)) {
    throw new Error('Invalid user data');
  }
  return data;
}
```

## React Component Types

### Functional Components

```typescript
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false
}: ButtonProps): JSX.Element {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={variant}
    >
      {children}
    </button>
  );
}
```

### Event Handlers

```typescript
function handleClick(event: React.MouseEvent<HTMLButtonElement>): void {
  event.preventDefault();
  // Handle click
}

function handleChange(event: React.ChangeEvent<HTMLInputElement>): void {
  const value = event.target.value;
  // Handle change
}

function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
  event.preventDefault();
  // Handle submit
}
```

### Refs

```typescript
const inputRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  inputRef.current?.focus();
}, []);
```

## Zod for Runtime Validation

Use Zod for parsing unknown data:

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().positive().optional(),
});

type User = z.infer<typeof UserSchema>;

function parseUser(data: unknown): User {
  return UserSchema.parse(data); // Throws if invalid
}

function safeParseUser(data: unknown): User | null {
  const result = UserSchema.safeParse(data);
  return result.success ? result.data : null;
}
```

## ESLint Rules

`.eslintrc.json`:

```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-return": "error",
    "@typescript-eslint/no-unsafe-call": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

## Type Checking Commands

```bash
# Run type check
npm run type-check

# Watch mode
tsc --noEmit --watch

# Generate declaration files
tsc --declaration --emitDeclarationOnly
```

## Common Mistakes to Avoid

### 1. Don't use Type Assertions Without Validation

```typescript
// ❌ Bad
const user = data as User; // Unsafe!

// ✅ Good
if (isUser(data)) {
  const user = data; // Type narrowed safely
}
```

### 2. Don't ignore undefined in arrays

```typescript
// ❌ Bad (assumes first item exists)
const first = array[0];
first.doSomething(); // Could crash

// ✅ Good
const first = array[0];
if (first) {
  first.doSomething();
}
```

### 3. Always Handle Promise Rejections

```typescript
// ❌ Bad
async function loadData() {
  const data = await fetchData();
}

// ✅ Good
async function loadData(): Promise<Data | null> {
  try {
    const data = await fetchData();
    return data;
  } catch (error) {
    console.error('Failed to load data:', error);
    return null;
  }
}
```

## Resources

- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/
- Strict Mode: https://www.typescriptlang.org/tsconfig#strict
- Type Guards: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- Utility Types: https://www.typescriptlang.org/docs/handbook/utility-types.html
