import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingModal } from '../../../src/components/OnboardingModal';
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
  User: () => <div data-testid="user-icon" />,
  ShieldCheck: () => <div data-testid="shield-icon" />,
  Box: () => <div data-testid="box-icon" />,
  UserCheck: () => <div data-testid="usercheck-icon" />,
  Phone: () => <div data-testid="phone-icon" />,
  Building2: () => <div data-testid="building-icon" />,
  Mail: () => <div data-testid="mail-icon" />,
}));

describe('OnboardingModal', () => {
  const mockAccept = vi.fn();
  const mockClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when show is false', () => {
    const { container } = render(
      <OnboardingModal
        show={false}
        user={{ email: 'test@example.com' }}
        profile={null}
        onAccept={mockAccept}
        onClose={mockClose}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('binds inputs and calls onAccept on form submit when valid', () => {
    render(
      <OnboardingModal
        show={true}
        user={{ email: 'test@example.com', displayName: 'Rune Larsen' }}
        profile={null}
        onAccept={mockAccept}
        onClose={mockClose}
      />
    );

    // Verify profile inputs
    const nameInput = screen.getByPlaceholderText('e.g. Rune Larsen');
    const companyInput = screen.getByPlaceholderText('e.g. Scape Solutions A/S');
    const phoneInput = screen.getByPlaceholderText('e.g. +45 12345678');

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(companyInput, { target: { value: 'ACME Corp' } });
    fireEvent.change(phoneInput, { target: { value: '+45 99999999' } });

    // Select role
    const roleSelect = screen.getByRole('combobox');
    fireEvent.change(roleSelect, { target: { value: 'enduser' } });

    // Accept TOS checkbox
    const tosCheckbox = screen.getByRole('checkbox');
    fireEvent.click(tosCheckbox);

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Accept & Continue/i });
    fireEvent.click(submitBtn);

    expect(mockAccept).toHaveBeenCalledWith({
      name: 'John Doe',
      company: 'ACME Corp',
      phone: '+45 99999999',
      role: 'enduser',
    });
  });
});
