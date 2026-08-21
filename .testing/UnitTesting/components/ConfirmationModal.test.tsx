import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmationModal } from '../../../src/components/ConfirmationModal';
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
  Trash2: () => <div data-testid="trash-icon" />,
  Info: () => <div data-testid="info-icon" />,
}));

describe('ConfirmationModal', () => {
  const mockConfirm = vi.fn();
  const mockCancel = vi.fn();

  it('renders nothing when show is false', () => {
    const { container } = render(
      <ConfirmationModal
        show={false}
        title="Delete?"
        message="Are you sure?"
        onConfirm={mockConfirm}
        onCancel={mockCancel}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly and calls callbacks', () => {
    render(
      <ConfirmationModal
        show={true}
        title="Confirm action"
        message="Please verify this operation"
        onConfirm={mockConfirm}
        onCancel={mockCancel}
        confirmText="Yes, Proceed"
      />
    );

    expect(screen.getByText('Confirm action')).toBeInTheDocument();
    expect(screen.getByText('Please verify this operation')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelBtn);
    expect(mockCancel).toHaveBeenCalledTimes(1);

    const confirmBtn = screen.getByRole('button', { name: 'Yes, Proceed' });
    fireEvent.click(confirmBtn);
    expect(mockConfirm).toHaveBeenCalledTimes(1);
  });

  it('enforces required text confirmation', () => {
    render(
      <ConfirmationModal
        show={true}
        title="Dangerous Action"
        message="Requires typing confirmation"
        onConfirm={mockConfirm}
        onCancel={mockCancel}
        requireTextConfirm="DELETE"
        type="danger"
      />
    );

    const confirmBtn = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmBtn).toBeDisabled();

    const input = screen.getByPlaceholderText('Type "DELETE"...');

    // Type incorrect value
    fireEvent.change(input, { target: { value: 'DEL' } });
    expect(confirmBtn).toBeDisabled();

    // Type correct value
    fireEvent.change(input, { target: { value: 'DELETE' } });
    expect(confirmBtn).not.toBeDisabled();
  });
});
