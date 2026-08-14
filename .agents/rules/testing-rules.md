# Testing Rules & Guidelines

All testing code written in this repository must conform to the following standards. Follow these rules automatically when creating or editing source files and tests.

---

## 1. Core Testing Stack
- **Test Runner:** Always use **Vitest** for running unit and integration tests. Do not introduce Jest or other runners.
- **DOM Environment:** Always configure tests to run in a **happy-dom** environment (specified in configuration or test headers).
- **Libraries:** Only use **React Testing Library** (`@testing-library/react`) and native **Vitest** mocks/utilities. Do not pull in out-of-scope testing packages.

---

## 2. Test File Location and Naming
- Always colocate unit tests next to the source files they test.
  - Source: `src/components/MyComponent.tsx` ➡️ Test: `src/components/MyComponent.test.tsx`
  - Source: `src/utils/parser.ts` ➡️ Test: `src/utils/parser.test.ts`
- Name test files with `.test.ts` or `.test.tsx` extensions.

---

## 3. Mocking & Service Boundaries
- **API Mocking:** Stub the global `fetch` directly with `vi.stubGlobal('fetch', ...)` to verify URL and method contracts.
- **Database/Firestore Mocking:** Mock at the service or custom hook layer (e.g. mock the return of `useProjects` or helper functions) rather than mocking Firestore SDK internals.
- **Authentication:** Wrap components in their respective provider contexts or mock auth hook outputs (like `useAuth`) to test state-based navigation (e.g. view transitions in `App.tsx`).
- **Browser APIs:** If a component uses modern Web APIs (`localStorage`, `matchMedia`, `ResizeObserver`, etc.), mock these globals in `beforeEach` or `beforeAll` using `vi.stubGlobal`.

---

## 4. Best Practices
- **Type Safety:** Maintain full TypeScript types for mocked functions using `vi.mocked()`.
- **Isolation of Updates:** Wrap all state-changing actions inside `act(() => { ... })` when testing custom hooks or direct element interactions.
- **Cleanup:** Reset mocks after each test run using `vi.clearAllMocks()` in an `afterEach` hook.
