---
name: mocking-browser-apis
description: >-
  Provides workflows, procedures, and code templates for mocking browser-native APIs and globals
  (like localStorage, matchMedia, ResizeObserver, and Clipboard) in Vitest unit/integration tests.
---

# Mocking Browser APIs and Globals

This skill outlines how to mock browser-native APIs and variables that are either not supported or not fully implemented by simulated browser environments like `happy-dom` or `jsdom`. This is critical for preventing runtime crashes when testing React components that access global Web APIs.

---

## 1. Mocking LocalStorage and SessionStorage

Web Storage APIs are often missing or reset incorrectly across test boundaries. Use Vitest to mock storage properties directly.

### Example: Mocking localStorage
```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';

class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}

describe('localStorage dependent code', () => {
  beforeEach(() => {
    // Stub global localStorage with our mock class
    vi.stubGlobal('localStorage', new LocalStorageMock());
  });

  it('correctly reads and writes mock data', () => {
    localStorage.setItem('theme', 'dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });
});
```

---

## 2. Mocking Media Queries (`window.matchMedia`)

Components that adapt based on responsive screen sizes (e.g., sidebars or modal overlays) use `window.matchMedia`, which is missing in simple environments.

### Example: Stubbing matchMedia globally
```typescript
import { vi, beforeAll } from 'vitest';

beforeAll(() => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('min-width: 768px'), // Simulate screen size conditions
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated but often called by legacy scripts
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});
```

---

## 3. Mocking Modern Layout & Element Observers

Libraries for animations, virtualized lists, or drag-and-drop actions rely on `ResizeObserver`, `IntersectionObserver`, or `MutationObserver`.

### Example: Stubbing ResizeObserver and IntersectionObserver
```typescript
import { vi, beforeAll } from 'vitest';

beforeAll(() => {
  // Mock ResizeObserver
  vi.stubGlobal(
    'ResizeObserver',
    vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }))
  );

  // Mock IntersectionObserver
  vi.stubGlobal(
    'IntersectionObserver',
    vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      takeRecords: vi.fn().mockReturnValue([]),
    }))
  );
});
```

---

## 4. Mocking Scrolling Behaviors (`window.scrollTo`)

Tests checking view scrolling or navigation scroll resets will error out if `window.scrollTo` or `element.scrollIntoView` are undefined.

### Example: Mocking scrolling functions
```typescript
import { vi, beforeAll } from 'vitest';

beforeAll(() => {
  window.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});
```

---

## 5. Mocking Clipboard Interactions

Components that let users copy code, logs, or share links will crash if `navigator.clipboard` is not stubbed in tests.

### Example: Stubbing writeText for clipboard
```typescript
import { vi, describe, it, expect } from 'vitest';

describe('CopyButton component integration', () => {
  it('calls writeText with the expected sharing URL', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    await navigator.clipboard.writeText('https://example.com');
    expect(writeTextMock).toHaveBeenCalledWith('https://example.com');
  });
});
```
