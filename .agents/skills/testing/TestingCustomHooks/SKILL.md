---
name: testing-custom-hooks
description: >-
  Provides workflows, procedures, and code templates for unit and integration testing of custom React hooks
  and Context Providers using renderHook and context wrappers in Vitest.
---

# Testing Custom Hooks and Context Providers

This skill describes how to test custom React hooks in isolation or integration using `@testing-library/react`'s `renderHook` utility. Since this project relies heavily on custom stateful hooks (like `useAuth` and `useProjects`), this skill ensures hooks behave correctly when managing state, firing side effects, and accessing React Context.

---

## 1. Testing Simple Stateful Hooks

To test a custom hook that doesn't depend on external context providers, use the `renderHook` utility. The returned `result.current` contains the value returned by the hook.

> [!IMPORTANT]
> When testing hooks that perform state updates or side effects, wrap the updates inside `act(...)` from `@testing-library/react` to ensure state changes are flushed to the DOM environment.

### Example: Testing a Counter Hook
```typescript
import { useState, useCallback } from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

// Custom Hook
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  const increment = useCallback(() => setCount((c) => c + 1), []);
  return { count, increment };
}

describe('useCounter', () => {
  it('should initialize with correct value', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it('should increment correctly when action is triggered', () => {
    const { result } = renderHook(() => useCounter(0));
    
    // Wrap state updates in act()
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });
});
```

---

## 2. Testing Hooks with Context Dependencies

If a hook depends on a React Context Provider (e.g. accessing a theme context or user authentication profile), use the `wrapper` option in `renderHook` to wrap the hook execution in the provider.

### Example: Testing a Hook with AuthContext Wrapper
```tsx
import React, { createContext, useContext, useState } from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

// AuthContext definition
const UserContext = createContext<{ user: string | null; login: (name: string) => void } | null>(null);

const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<string | null>(null);
  const login = (name: string) => setUser(name);
  return <UserContext.Provider value={{ user, login }}>{children}</UserContext.Provider>;
};

// Hook under test
function useUserProfile() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUserProfile must be used within UserProvider');
  return context;
}

describe('useUserProfile', () => {
  it('should retrieve and update user context data', () => {
    // Render hook inside the UserProvider wrapper
    const { result } = renderHook(() => useUserProfile(), {
      wrapper: UserProvider,
    });

    expect(result.current.user).toBeNull();

    act(() => {
      result.current.login('Jane Doe');
    });

    expect(result.current.user).toBe('Jane Doe');
  });
});
```

---

## 3. Testing Async Operations and Side Effects in Hooks

When a hook triggers asynchronous logic (e.g., fetch request or timeout state changes), use `waitFor` or asynchronous helpers within the test to wait for the hook's returned state to update.

### Example: Testing a Data Fetching Hook
```typescript
import { useState, useEffect } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

// Hook under test
function useFetchData(url: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      });
  }, [url]);

  return { data, loading };
}

describe('useFetchData', () => {
  it('updates state after async fetch completes', async () => {
    // Stub global fetch
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ success: true }),
      })
    ));

    const { result } = renderHook(() => useFetchData('/api/status'));

    // Loading should initially be true
    expect(result.current.loading).toBe(true);

    // Wait until loading becomes false
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({ success: true });
  });
});
```
