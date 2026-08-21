import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileSetupView } from '../../../src/views/ProfileSetupView';
import { UserProfile } from '../../../src/types';

describe('ProfileSetupView', () => {
  const mockSetProfile = vi.fn();
  const mockSaveProfile = vi.fn();
  const mockIsScapeEmployee = vi.fn().mockReturnValue(false);
  const mockIsAllowedEvaluator = vi.fn().mockReturnValue(false);
  const mockIsDynamicSuperuser = vi.fn().mockReturnValue(false);

  const baseProps = {
    profile: {
      name: '',
      company: '',
      role: 'enduser' as const,
      email: 'test@example.com',
    } as UserProfile,
    setProfile: mockSetProfile,
    saveProfile: mockSaveProfile,
    isScapeEmployee: mockIsScapeEmployee,
    isAllowedEvaluator: mockIsAllowedEvaluator,
    isDynamicSuperuser: mockIsDynamicSuperuser,
    userEmail: 'test@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders inputs for profile completion', () => {
    render(<ProfileSetupView {...baseProps} />);
    expect(screen.getByText('Complete your profile')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Company / Organization')).toBeInTheDocument();
  });

  it('disables save button if fields are incomplete', () => {
    render(<ProfileSetupView {...baseProps} />);
    const startBtn = screen.getByRole('button', { name: 'Start Evaluating' });
    expect(startBtn).toHaveClass('bg-slate-300');
  });

  it('enables and calls saveProfile when valid fields exist and button is clicked', () => {
    const validProfile: UserProfile = {
      name: 'Rune Larsen',
      company: 'Scape Solutions',
      role: 'integrator',
      email: 'rune@scapesolutions.eu',
    };
    render(
      <ProfileSetupView
        {...baseProps}
        profile={validProfile}
      />
    );

    const startBtn = screen.getByRole('button', { name: 'Start Evaluating' });
    expect(startBtn).not.toHaveClass('bg-slate-300');
    fireEvent.click(startBtn);
    expect(mockSaveProfile).toHaveBeenCalledWith(validProfile);
  });
});
