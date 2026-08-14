---
name: integration-testing
description: >-
  Provides workflows, procedures, and code templates for integration testing of multiple React components
  and TypeScript modules using React Testing Library to verify system flow, configuration, auth, serialization, and API boundaries.
---

# Integration Testing React and TypeScript Files (React Testing Library)

This skill outlines how to write and execute integration tests to ensure that multiple components, services, and modules in this system work harmoniously. The main goal is to identify points of failure at component boundaries, data-flows, serialization/deserialization logic, APIs, configurations, and authentication states.

---

## 1. Scope and Core Targets

Integration testing in this project is focused on the interaction between multiple units. Do not mock internal child components; instead, render full workflows (e.g., rendering a full Form and List parent-child relationship together) to detect:

- **Component Integration:** Verifying that multiple components work as intended together without breaking contracts.
- **Data Contract Mismatches:** Catching when one component sends data in a format the receiving component does not expect.
- **API Boundary & Endpoint Errors:** Checking that incorrect API endpoints or parameters are caught by intercepting HTTP requests.
- **Database/Service Queries:** Verifying query builders, URL generation, and request format validation.
- **Auth & Service Boundaries:** Testing routing and view switches when auth states change or fail.
- **Serialization & Configuration:** Handling JSON parse errors, config overrides (e.g., environment variables), and persistence storage.

---

## 2. Testing Component Communication & Data Formats

To ensure components exchange data in the expected format (addressing points **a, b, and f**), test them in pairs or as complete parent-child hierarchies.

### Example: Verifying Form-to-List Data Hand-off
```tsx
import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

// Child 1: Form
const ItemForm = ({ onSubmit }: { onSubmit: (data: { title: string; count: number }) => void }) => {
  const [title, setTitle] = useState('');
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ title, count: 1 }); }}>
      <input aria-label="Item Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <button type="submit">Add</button>
    </form>
  );
};

// Child 2: List
const ItemList = ({ items }: { items: Array<{ title: string; count: number }> }) => (
  <ul>
    {items.map((item, idx) => (
      <li key={idx}>{item.title} (x{item.count})</li>
    ))}
  </ul>
);

// Parent Container
const Dashboard = () => {
  const [list, setList] = useState<Array<{ title: string; count: number }>>([]);
  return (
    <div>
      <ItemForm onSubmit={(item) => setList([...list, item])} />
      <ItemList items={list} />
    </div>
  );
};

describe('Dashboard Integration', () => {
  it('correctly passes formatted data from ItemForm to ItemList', () => {
    render(<Dashboard />);
    
    const input = screen.getByLabelText('Item Title');
    fireEvent.change(input, { target: { value: 'New Task' } });
    fireEvent.click(screen.getByRole('button', { name: /add/i }));
    
    // Verify that the child list rendering reflects correct format integration
    expect(screen.getByText('New Task (x1)')).toBeInTheDocument();
  });
});
```

---

## 3. Testing API Endpoints and Network Integration

To catch incorrect API endpoints, database queries, and serialization errors (addressing points **c and g**), intercept outbound calls and test parsing functions.

### Intercepting and Verifying API Calls
Always mock global `fetch` directly using Vitest's built-in `vi.stubGlobal('fetch')` to check if correct API endpoints and request payloads are constructed when user interaction occurs:

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Component making an API/Database query call
const ProjectSaver = ({ projectId }: { projectId: string }) => {
  const handleSave = async () => {
    await fetch(`/api/projects/${projectId}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ savedAt: new Date().toISOString() })
    });
  };
  return <button onClick={handleSave}>Save Project</button>;
};

describe('ProjectSaver Integration', () => {
  beforeEach(() => {
    // Standard approach: stub global fetch directly
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true })));
  });

  it('sends POST request to the correct endpoint with proper payload format', async () => {
    render(<ProjectSaver projectId="123-abc" />);
    
    fireEvent.click(screen.getByRole('button', { name: /save project/i }));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/projects/123-abc/save', // Verifying endpoint validity
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('savedAt') // Verifying serialization format
        })
      );
    });
  });
});
```

---

## 4. Testing Database Operations at the Service / Hook Layer

Rather than mocking complex Firestore SDK internals, mock queries at the service helper or hook layer (addressing point **d**). This prevents tests from becoming brittle.

### Example: Mocking a Project Hook Wrapper (`useProjects`)
```typescript
import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useProjects } from '../hooks/useProjects';
import { DashboardView } from '../views/DashboardView';

vi.mock('../hooks/useProjects', () => ({
  useProjects: vi.fn(),
}));

describe('DashboardView Database Integration', () => {
  it('renders project list fetched from database', () => {
    // Mock the hook to simulate successful query output from Firestore
    vi.mocked(useProjects).mockReturnValue({
      projects: [
        { id: 'proj-1', name: 'Bin-Picking Project Denmark' },
        { id: 'proj-2', name: 'Smart Sorter Project Germany' }
      ],
      loading: false,
      error: null
    } as any);

    render(<DashboardView />);
    
    expect(screen.getByText('Bin-Picking Project Denmark')).toBeInTheDocument();
    expect(screen.getByText('Smart Sorter Project Germany')).toBeInTheDocument();
  });
});
```

---

## 5. Testing Authentication & State-Based Routing

For state-based screen transitions controlled by hooks/states (addressing point **e**), render the root `App` component and mock auth hook returns dynamically:

```tsx
import React from 'react';
import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useAuth } from './hooks/useAuth';
import App from './App';

vi.mock('./hooks/useAuth', () => ({
  useAuth: vi.fn(),
  isScapeEmployee: vi.fn(),
  getEffectiveAdminStatus: vi.fn(),
  isDynamicAllowedEvaluator: vi.fn(),
  isDynamicSuperuser: vi.fn()
}));

describe('App Router Integration', () => {
  it('displays AuthView when user is unauthenticated', () => {
    // Mock useAuth to return no authenticated user
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      error: null
    } as any);

    render(<App />);
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });

  it('navigates to DashboardView when user is authenticated', () => {
    // Mock useAuth to return a valid logged-in user
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'user123', email: 'employee@scape.dk' },
      loading: false,
      error: null
    } as any);

    render(<App />);
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });
});
```

---

## 6. Testing Configurations & Environment Variables

Verify component logic adapts correctly to changes in system configuration or Vite environment variables (addressing point **i**).

### Example: Testing Environment Configurations
```typescript
import { vi, describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConfiguredBanner } from './ConfiguredBanner';

describe('ConfiguredBanner environment integration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('shows production badge when environment is production', () => {
    vi.stubEnv('VITE_APP_ENV', 'production');
    render(<ConfiguredBanner />);
    expect(screen.getByText('Production Mode')).toBeInTheDocument();
  });
});
```
