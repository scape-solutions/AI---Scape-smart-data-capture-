import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthView } from '../../../src/views/AuthView';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Cpu: () => <div data-testid="cpu-icon" />,
  X: () => <div data-testid="x-icon" />,
}));

describe('AuthView', () => {
  const mockSetAuthStep = vi.fn();
  const mockSetAuthEmail = vi.fn();
  const mockSetAuthPassword = vi.fn();
  const mockSetAuthDisplayName = vi.fn();
  const mockLoginWithEmail = vi.fn();
  const mockSignupWithEmail = vi.fn();
  const mockLoginWithGoogle = vi.fn();

  const baseProps = {
    authStep: 'signin' as const,
    setAuthStep: mockSetAuthStep,
    authEmail: '',
    setAuthEmail: mockSetAuthEmail,
    authPassword: '',
    setAuthPassword: mockSetAuthPassword,
    authDisplayName: '',
    setAuthDisplayName: mockSetAuthDisplayName,
    authError: null,
    loginWithEmail: mockLoginWithEmail,
    signupWithEmail: mockSignupWithEmail,
    loginWithGoogle: mockLoginWithGoogle,
    authLoading: false,
  };

  it('renders sign in fields correctly', () => {
    render(<AuthView {...baseProps} />);
    expect(screen.getByText('Scape Evaluator')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('triggers loginWithEmail when credentials are typed and submit clicked', () => {
    render(
      <AuthView
        {...baseProps}
        authEmail="user@example.com"
        authPassword="securepassword"
      />
    );

    const submitBtn = screen.getAllByRole('button', { name: 'Sign In' }).find(el => el.classList.contains('bg-slate-900'))!;
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    expect(mockLoginWithEmail).toHaveBeenCalledTimes(1);
  });

  it('renders Full Name field on Sign Up tab', () => {
    render(<AuthView {...baseProps} authStep="signup" />);
    expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument();
  });
});
