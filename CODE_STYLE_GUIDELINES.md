# Code Style Guidelines

This document outlines the code style standards and best practices for the Define Horizon BMS project.

## Overview

We use **ESLint** for code linting and **Prettier** for code formatting to maintain consistency and quality across the codebase. These tools are integrated with pre-commit hooks to enforce standards automatically.

---

## ESLint Configuration

### Enabled Rules

Our ESLint configuration extends `next/core-web-vitals` and `next/typescript` with the following customizations:

#### TypeScript Rules

- **`@typescript-eslint/no-unused-vars`**: Warns about unused variables (allows `_` prefix for intentionally unused parameters)
- **`@typescript-eslint/explicit-function-return-types`**: Warns when function return types are not explicitly specified (with exceptions for expressions and higher-order functions)
- **`@typescript-eslint/no-explicit-any`**: Warns about use of `any` type (should use specific types)

#### React Rules

- **`react/react-in-jsx-scope`**: Disabled (not needed in Next.js)
- **`react/prop-types`**: Disabled (TypeScript handles type checking)

#### Console Rules

- **`no-console`**: Warns about console statements except `console.warn()` and `console.error()`

### Running ESLint

```bash
# Check for linting errors
npm run lint

# Fix auto-fixable linting errors
npm run lint:fix
```

---

## Prettier Configuration

### Formatting Rules

```json
{
  "semi": true, // Require semicolons
  "trailingComma": "es5", // Trailing commas where valid in ES5
  "singleQuote": true, // Use single quotes instead of double
  "printWidth": 100, // Line length limit
  "tabWidth": 2, // 2 spaces per indentation level
  "useTabs": false, // Use spaces, not tabs
  "arrowParens": "always", // Include parens around single arrow function arguments
  "endOfLine": "lf" // Unix line endings
}
```

### Running Prettier

```bash
# Format all files
npm run format

# Check if files are formatted
npm run format:check
```

---

## Pre-Commit Hooks

We use **Husky** and **lint-staged** to automatically lint and format staged files before committing.

### What Happens on Commit

1. Husky intercepts the `git commit` command
2. `lint-staged` runs on staged files only
3. For TypeScript/JavaScript files:
   - ESLint is run with `--fix` to auto-fix issues
   - Prettier is run to format code
4. For JSON and Markdown files:
   - Prettier is run for formatting
5. If any check fails, the commit is blocked

### Staged File Patterns

- `*.ts` / `*.tsx` → ESLint fix + Prettier
- `*.js` / `*.jsx` → ESLint fix + Prettier
- `*.json` → Prettier
- `*.md` → Prettier

### Installation

```bash
# Initialize husky (already done)
npx husky install
```

---

## TypeScript Best Practices

### Type Annotations

Always provide explicit type annotations for function parameters and return types:

```typescript
// ✅ Good
function calculateTotal(items: Item[], discount: number): number {
  return items.reduce((sum, item) => sum + item.price, 0) * (1 - discount);
}

// ❌ Avoid
function calculateTotal(items, discount) {
  return items.reduce((sum, item) => sum + item.price, 0) * (1 - discount);
}
```

### Avoid `any`

Use specific types instead of `any`:

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
  email: string;
}

function processUser(user: User): void {
  // ...
}

// ❌ Avoid
function processUser(user: any): void {
  // ...
}
```

### Unused Variables

Use underscore prefix for intentionally unused parameters:

```typescript
// ✅ Good
function onError(_error: Error, _context: Context): void {
  logger.warn('Error occurred');
}

// ❌ Avoid
function onError(error: Error, context: Context): void {
  logger.warn('Error occurred');
}
```

---

## Naming Conventions

### Files and Directories

- **Components**: PascalCase (e.g., `UserCard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Types**: PascalCase in dedicated files (e.g., `User.ts`)
- **Tests**: `*.test.ts` or `*.test.tsx`

### Variables and Functions

- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)
- **Variables**: camelCase (e.g., `userName`)
- **Functions**: camelCase (e.g., `getUserData()`)
- **Classes**: PascalCase (e.g., `UserService`)
- **Interfaces**: PascalCase with `I` prefix or without (e.g., `User` or `IUser`)

---

## React Components

### Functional Components

Always use functional components with TypeScript:

```typescript
interface UserCardProps {
  name: string;
  email: string;
  onDelete?: () => void;
}

export function UserCard({ name, email, onDelete }: UserCardProps): JSX.Element {
  return (
    <div>
      <h3>{name}</h3>
      <p>{email}</p>
      {onDelete && <button onClick={onDelete}>Delete</button>}
    </div>
  );
}
```

### Props Typing

Define prop interfaces for all components:

```typescript
// ✅ Good
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}

export function Button({ variant = 'primary', loading, ...props }: ButtonProps) {
  return <button className={`btn-${variant}`} disabled={loading} {...props} />;
}
```

---

## Import Organization

Organize imports in this order:

1. External dependencies (React, Next.js, etc.)
2. Internal components and utilities
3. Relative imports

```typescript
// ✅ Good
import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/router';

import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/formatDate';
import { UserService } from '@/services/UserService';

import { Button } from '../Button';
import { useLocalStorage } from './useLocalStorage';
```

---

## Comments and Documentation

### Function Documentation

Use JSDoc comments for public functions:

```typescript
/**
 * Fetches user data from the API
 * @param userId - The unique identifier of the user
 * @returns Promise resolving to User object
 * @throws Error if user not found
 */
async function fetchUser(userId: string): Promise<User> {
  // ...
}
```

### Inline Comments

Keep inline comments brief and explain _why_, not _what_:

```typescript
// ✅ Good
// Retry failed requests up to 3 times to handle transient failures
if (retryCount < 3) {
  await delay(exponentialBackoff(retryCount));
  return fetchData();
}

// ❌ Avoid
// Check if retry count is less than 3
if (retryCount < 3) {
```

---

## Git Workflow

### Before Committing

```bash
# Stage your changes
git add .

# Husky will automatically run lint and format checks
git commit -m "feat: add user authentication"
```

### If Commit is Blocked

1. Review the linting/formatting errors
2. Auto-fixes can be applied manually:
   ```bash
   npm run lint:fix
   npm run format
   ```
3. Stage the fixed files and commit again

---

## IDE Configuration

### VS Code Settings

Add to `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.formatOnPaste": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "eslint.validate": ["typescript", "typescriptreact"]
}
```

### VS Code Extensions

- **ESLint**: dbaeumer.vscode-eslint
- **Prettier**: esbenp.prettier-vscode

---

## Performance Considerations

### Memoization

Use React.memo and useMemo for expensive computations:

```typescript
export const UserCard = React.memo(({ user }: { user: User }) => {
  return <div>{user.name}</div>;
});

function ExpensiveComponent() {
  const sortedUsers = useMemo(() => users.sort((a, b) => a.name.localeCompare(b.name)), [users]);
  return <div>{sortedUsers.map((u) => u.name)}</div>;
}
```

### Lazy Loading

Lazy load non-critical components:

```typescript
const HeavyModal = lazy(() => import('./HeavyModal'));

export function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HeavyModal />
    </Suspense>
  );
}
```

---

## Testing Standards

### Unit Tests

```typescript
// calculateTotal.test.ts
import { calculateTotal } from './calculateTotal';

describe('calculateTotal', () => {
  it('should calculate total without discount', () => {
    const items = [{ price: 10 }, { price: 20 }];
    expect(calculateTotal(items, 0)).toBe(30);
  });

  it('should apply discount correctly', () => {
    const items = [{ price: 100 }];
    expect(calculateTotal(items, 0.1)).toBe(90);
  });
});
```

---

## CI/CD Integration

### GitHub Actions

The following checks run on every pull request:

```yaml
- Run ESLint
- Run Prettier check
- Run tests
- Build project
```

Ensure all checks pass before merging.

---

## Questions or Suggestions?

If you have questions about the code style guidelines or suggestions for improvements, please reach out to the development team.

---

## Quick Reference

| Tool     | Command                | Purpose                  |
| -------- | ---------------------- | ------------------------ |
| ESLint   | `npm run lint`         | Check for linting errors |
| ESLint   | `npm run lint:fix`     | Auto-fix linting errors  |
| Prettier | `npm run format`       | Format all files         |
| Prettier | `npm run format:check` | Check formatting         |
