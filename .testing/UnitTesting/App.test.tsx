import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../src/App';

// Mock raw imports
vi.mock('../../src/docs/externalAdvicePrompt.md?raw', () => ({ default: 'mock external advice' }));
vi.mock('../../src/docs/evaluatorDraftPrompt.md?raw', () => ({ default: 'mock evaluator draft' }));
vi.mock('../../src/docs/autoFillPrompt.md?raw', () => ({ default: 'mock auto fill' }));
vi.mock('../../src/docs/observationsExtractionPrompt.md?raw', () => ({ default: 'mock observations extraction' }));

// Mock subcomponents/views to make the App test isolation clean
vi.mock('../../src/components/SplashScreen', () => ({
  SplashScreen: ({ onClose }: any) => (
    <div data-testid="mock-splash">
      <span>Splash Screen Active</span>
      <button onClick={onClose}>Dismiss Splash</button>
    </div>
  ),
}));

vi.mock('../../src/views/AuthView', () => ({
  AuthView: () => <div data-testid="mock-auth-view">Auth Screen</div>,
}));

vi.mock('../../src/views/DashboardView', () => ({
  DashboardView: () => <div data-testid="mock-dashboard-view">Dashboard Screen</div>,
}));

// Mock hooks
vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: null,
    profile: null,
    view: 'dashboard',
    authError: null,
    authLoading: false,
  }),
  isScapeEmployee: vi.fn().mockReturnValue(false),
  getEffectiveAdminStatus: vi.fn().mockReturnValue(false),
  isDynamicAllowedEvaluator: vi.fn().mockReturnValue(false),
  isDynamicSuperuser: vi.fn().mockReturnValue(false),
}));

vi.mock('../../src/hooks/useProjects', () => ({
  useProjects: vi.fn().mockReturnValue({
    projects: [],
    loading: false,
    error: null,
  }),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders splash screen on initial startup', () => {
    render(<App />);
    expect(screen.getByTestId('mock-splash')).toBeInTheDocument();
  });

  it('navigates to AuthView after splash screen is dismissed when user is logged out', async () => {
    render(<App />);
    
    // Click button to dismiss splash screen
    const dismissBtn = screen.getByRole('button', { name: 'Dismiss Splash' });
    fireEvent.click(dismissBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('mock-splash')).not.toBeInTheDocument();
      expect(screen.getByTestId('mock-auth-view')).toBeInTheDocument();
    });
  });
});
