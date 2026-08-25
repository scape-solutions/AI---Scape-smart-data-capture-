---
name: testing
description: >-
  Provides workflows, procedures, and code templates for unit testing React (TSX) and TypeScript (TS) files
  using Vitest and React Testing Library with happy-dom.
---

# Unit Testing React and TypeScript Files (Vitest + React Testing Library)

This skill outlines how to write, run, and configure unit tests for React components and TypeScript logic using **Vitest**, **React Testing Library**, and **happy-dom**. The main goal is to verify that custom functions, methods, and component behaviors work as intended.

---

## 1. Test Setup and Configuration

### Vitest Configuration (`vite.config.ts` or `vitest.config.ts`)
Configure Vitest to use `happy-dom` as the DOM environment and point to a setup file:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: './vitest.setup.ts',
  },
});
```

### Global Test Setup (`vitest.setup.ts`)
Create a setup file at the root level to configure global matchers (e.g., from `@testing-library/jest-dom`) and handle automatic cleanup:
```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Automatically clean up rendering context after each test
afterEach(() => {
  cleanup();
});
```

---

## 2. Test File Location and Naming
Colocate your test files directly alongside the source files you are testing.
- **TypeScript Logic:** `src/utils/math.ts` ➡️ `src/utils/math.test.ts`
- **React Components:** `src/components/Button.tsx` ➡️ `src/components/Button.test.tsx`

---

## 3. Unit Testing TypeScript Logic

For pure TypeScript files (e.g., utility functions or class methods), test the logic directly by calling the methods with inputs and asserting the outputs.

### Example: Testing a TypeScript Helper (`questionnaire.test.ts`)
```typescript
import { describe, it, expect } from 'vitest';
import { calculateProgress } from './questionnaire';

describe('calculateProgress', () => {
  it('should return 0 when no questions are answered', () => {
    const questions = [{ id: '1', answered: false }, { id: '2', answered: false }];
    expect(calculateProgress(questions)).toBe(0);
  });

  it('should return 100 when all questions are answered', () => {
    const questions = [{ id: '1', answered: true }, { id: '2', answered: true }];
    expect(calculateProgress(questions)).toBe(100);
  });
});
```

---

## 4. Unit Testing React Components

Use `@testing-library/react` to test component behavior from the user's perspective rather than testing internal implementation details.

### Core Testing Principles
1. **Querying Elements:** Prefer `screen.getByRole` for accessibility-friendly queries, followed by `screen.getByText` or `screen.getByLabelText`.
2. **User Events:** Use `fireEvent` (or `@testing-library/user-event` if available) to simulate user actions (e.g., `fireEvent.click(button)`).
3. **Assertions:** Use `expect(element).toBeInTheDocument()`, `expect(element).toHaveTextContent()`, or `expect(button).toBeDisabled()`.

### Example: Testing a Component (`MyComponent.test.tsx`)
```tsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders the initial state correctly', () => {
    render(<MyComponent title="Hello World" />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('triggers action on button click', () => {
    const handleAction = vi.fn();
    render(<MyComponent title="Test" onAction={handleAction} />);
    
    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);
    
    expect(handleAction).toHaveBeenCalledTimes(1);
  });
});
```

---

## 5. Mocking Hooks and External Modules

When testing components that rely on stateful hooks or external services (e.g., Firebase, Lucide icons), mock those modules using `vi.mock` at the top of your test file.

### Example: Mocking Firebase Hooks
```typescript
import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { ProfileCard } from './ProfileCard';

// Mock the hook module
vi.mock('react-firebase-hooks/auth', () => ({
  useAuthState: vi.fn(),
}));

describe('ProfileCard', () => {
  it('renders loading status when authenticating', () => {
    vi.mocked(useAuthState).mockReturnValue([null, true, undefined]);
    
    render(<ProfileCard />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders user details when logged in', () => {
    const mockUser = { displayName: 'John Doe', email: 'john@example.com' };
    vi.mocked(useAuthState).mockReturnValue([mockUser, false, undefined]);
    
    render(<ProfileCard />);
    expect(screen.getByText('Welcome, John Doe')).toBeInTheDocument();
  });
});
```

### Example: Mocking Lucide React Icons (Avoid icon render errors)
```typescript
vi.mock('lucide-react', () => ({
  ArrowRight: () => <div data-testid="arrow-right-icon" />,
  Check: () => <div data-testid="check-icon" />,
}));
```

---

## 6. Best Practices for React & TS Unit Tests

- **Type Safety in Tests:** Leverage `vi.mocked(myHook)` to maintain autocomplete and typescript types for mocked modules.
- **Clean Up Mocks:** Reset mock implementations between test runs:
  ```typescript
  afterEach(() => {
    vi.clearAllMocks();
  });
  ```
- **Async Elements:** Use `waitFor` or `findBy` queries when waiting for asynchronous updates:
  ```typescript
  const element = await screen.findByText('Async Loaded Content');
  expect(element).toBeInTheDocument();
  ```
