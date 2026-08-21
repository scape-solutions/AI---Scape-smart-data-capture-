import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../../../src/components/Header';
// .testing/setup.ts
import '@testing-library/jest-dom/vitest';

// Mock dependency imports
vi.mock('../../../src/hooks/useAuth', () => ({
  isDynamicSuperuser: vi.fn().mockReturnValue(false),
}));

vi.mock('lucide-react', () => ({
  LogOut: () => <div data-testid="logout-icon" />,
  User: () => <div data-testid="user-icon" />,
  X: () => <div data-testid="x-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  Mail: () => <div data-testid="mail-icon" />,
}));

describe('Header', () => {
  const mockLogout = vi.fn();
  const mockSetView = vi.fn();
  const mockSetGlobalError = vi.fn();
  const mockSetGlobalSuccess = vi.fn();
  const mockSwitchMode = vi.fn();
  const mockSaveProfile = vi.fn();
  const mockOpenToS = vi.fn();

  const mockProps = {
    user: { email: 'test@example.com' },
    profile: {
      name: 'John Doe',
      company: 'Test Corp',
      role: 'enduser' as const,
      email: 'test@example.com',
    },
    globalError: null,
    globalSuccess: null,
    setGlobalError: mockSetGlobalError,
    setGlobalSuccess: mockSetGlobalSuccess,
    setView: mockSetView,
    logout: mockLogout,
    switchMode: mockSwitchMode,
    isAllowedEvaluator: vi.fn().mockReturnValue(false),
    isScapeEmployee: vi.fn().mockReturnValue(false),
    saveProfile: mockSaveProfile,
    onOpenToS: mockOpenToS,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders brand logo and user details correctly', () => {
    render(<Header {...mockProps} />);

    expect(
      screen.getByTitle('Om Scape Bin-Picker Projects')
    ).toBeInTheDocument();

    expect(screen.getByText('SC')).toBeInTheDocument();
    expect(screen.getByText('PE')).toBeInTheDocument();
  });

  it('displays global errors and handles dismissal', () => {
    render(<Header {...mockProps} globalError="Failed connection" />);
    expect(screen.getByText('Error: Failed connection')).toBeInTheDocument();

    const dismissBtn = screen.getByRole('button', { name: 'Dismiss' });
    fireEvent.click(dismissBtn);
    expect(mockSetGlobalError).toHaveBeenCalledWith(null);
  });

  it('displays active project name if provided', () => {
    render(<Header {...mockProps} projectName="Project Delta" projectId="123" />);
    expect(screen.getByText('Project Delta')).toBeInTheDocument();
  });
});
