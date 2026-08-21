import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChangelogModal } from '../../../src/components/ChangelogModal';
// .testing/setup.ts
import '@testing-library/jest-dom/vitest';

// Mock motion components
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  XCircle: () => <div data-testid="x-icon" />,
}));

describe('ChangelogModal', () => {
  const mockClose = vi.fn();
  const mockChangelog = [
    {
      action: 'Created project',
      userName: 'John Doe',
      timestamp: { toDate: () => new Date('2026-08-01T10:00:00Z') },
    },
    {
      action: 'Updated status to submitted',
      userId: 'user-2',
      userRole: 'evaluator',
      timestamp: { toDate: () => new Date('2026-08-02T12:00:00Z') },
    },
  ];

  it('renders nothing when show is false', () => {
    const { container } = render(
      <ChangelogModal show={false} onClose={mockClose} changelog={mockChangelog} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders project history list and handles close click when show is true', () => {
    render(
      <ChangelogModal show={true} onClose={mockClose} changelog={mockChangelog} />
    );

    expect(screen.getByText('Project History')).toBeInTheDocument();
    expect(screen.getByText('Created project')).toBeInTheDocument();
    expect(screen.getByText('Updated status to submitted')).toBeInTheDocument();
    expect(screen.getByText(/User: John Doe/)).toBeInTheDocument();
    expect(screen.getByText(/User: user-2 \(evaluator\)/)).toBeInTheDocument();

    const closeBtn = screen.getByRole('button');
    fireEvent.click(closeBtn);
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
