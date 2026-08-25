import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActiveUsersModal } from '../../../src/components/ActiveUsersModal';
import { getDocsFromServer } from 'firebase/firestore';
// .testing/setup.ts
import '@testing-library/jest-dom/vitest';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Landmark: () => <div data-testid="landmark-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocsFromServer: vi.fn(),
  getDocs: vi.fn(),
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
        mockUsers.forEach(u => cb({ data: () => u }));
      },
    };
    vi.mocked(getDocsFromServer).mockResolvedValue(mockSnap as any);

    render(<ActiveUsersModal show={true} onClose={mockClose} />);

    await waitFor(() => {
      expect(screen.getByText('Alice Active')).toBeInTheDocument();
      expect(screen.getByText('Bob Inactive')).toBeInTheDocument();
    });

    expect(screen.getByText('Active Now')).toBeInTheDocument();
    expect(screen.getByText(/1h ago/)).toBeInTheDocument();
  });
});
