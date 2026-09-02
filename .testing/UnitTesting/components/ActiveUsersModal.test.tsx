import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActiveUsersModal } from '../../../src/components/ActiveUsersModal';
import { getDocsFromServer } from 'firebase/firestore';
// .testing/setup.ts
import '@testing-library/jest-dom/vitest';

// Mock Lucide icons
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<Record<string, any>>();
  return new Proxy(actual, {
    get: (target, prop) => {
      if (prop in target) return target[prop as string];
      return (props: any) => <div data-testid={`icon-${String(prop)}`} {...props} />;
    }
  });
});

let snapshotCallback: ((snap: any) => void) | null = null;

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  onSnapshot: vi.fn((col: any, cb: any) => {
    snapshotCallback = cb;
    return vi.fn(); // unsubscribe
  }),
  getDocsFromServer: vi.fn(),
  getDocs: vi.fn(),
  getFirestore: vi.fn().mockReturnValue({}),
  doc: vi.fn(),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  getDocFromServer: vi.fn().mockResolvedValue({}),
}));

describe('ActiveUsersModal', () => {
  const mockClose = vi.fn();
  const mockUsers = [
    {
      name: 'Alice Active',
      email: 'alice@example.com',
      company: 'Company A',
      role: 'enduser',
      lastActiveAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 mins ago (Active Now)
    },
    {
      name: 'Bob Inactive',
      email: 'bob@example.com',
      company: 'Company B',
      role: 'integrator',
      lastActiveAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when show is false', () => {
    const { container } = render(<ActiveUsersModal show={false} onClose={mockClose} />);
    expect(container.firstChild).toBeNull();
  });

  it('fetches and displays users when show is true', async () => {
    const mockSnap = {
      forEach: (cb: any) => {
        mockUsers.forEach((u, idx) => cb({ id: `user_${idx}`, data: () => u }));
      },
    };

    render(<ActiveUsersModal show={true} onClose={mockClose} />);

    if (snapshotCallback) {
      (snapshotCallback as any)(mockSnap);
    }

    await waitFor(() => {
      expect(screen.getByText('Alice Active')).toBeInTheDocument();
      expect(screen.getByText('Bob Inactive')).toBeInTheDocument();
    });

    expect(screen.getByText('Active Now')).toBeInTheDocument();
    expect(screen.getByText(/1h ago/)).toBeInTheDocument();
  });
});
