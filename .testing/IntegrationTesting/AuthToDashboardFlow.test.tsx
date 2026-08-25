import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../../src/App';
import { useAuth } from '../../src/hooks/useAuth';

// Mock raw assets
vi.mock('../../src/docs/externalAdvicePrompt.md?raw', () => ({ default: 'mock external advice' }));
vi.mock('../../src/docs/evaluatorDraftPrompt.md?raw', () => ({ default: 'mock evaluator draft' }));
vi.mock('../../src/docs/autoFillPrompt.md?raw', () => ({ default: 'mock auto fill' }));
vi.mock('../../src/docs/observationsExtractionPrompt.md?raw', () => ({ default: 'mock observations extraction' }));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  PlusCircle: () => <div data-testid="plus-icon" />,
  LayoutDashboard: () => <div data-testid="dash-icon" />,
  SlidersHorizontal: () => <div data-testid="slider-icon" />,
  Sparkles: () => <div data-testid="sparkles-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  Upload: () => <div data-testid="upload-icon" />,
  Download: () => <div data-testid="download-icon" />,
  CheckCircle: () => <div data-testid="check-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  Bot: () => <div data-testid="bot-icon" />,
  PencilLine: () => <div data-testid="pencil-icon" />,
  X: () => <div data-testid="x-icon" />,
  Users: () => <div data-testid="users-icon" />,
  LogOut: () => <div data-testid="logout-icon" />,
  User: () => <div data-testid="user-icon" />,
  Settings2: () => <div data-testid="settings-step-icon" />,
  Box: () => <div data-testid="box-step-icon" />,
  Zap: () => <div data-testid="zap-step-icon" />,
  Camera: () => <div data-testid="camera-step-icon" />,
}));

// Mock hooks
vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: vi.fn(),
  isScapeEmployee: vi.fn().mockReturnValue(true),
  getEffectiveAdminStatus: vi.fn().mockReturnValue(true),
  isDynamicAllowedEvaluator: vi.fn().mockReturnValue(true),
  isDynamicSuperuser: vi.fn().mockReturnValue(true),
}));

vi.mock('../../src/hooks/useProjects', () => ({
  useProjects: vi.fn().mockReturnValue({
    projects: [
      { id: '1', projectName: 'Robot Project A', status: 'draft', userId: 'u-1', parts: [] },
    ],
    loading: false,
    error: null,
  }),
}));

describe('Auth to Dashboard Transition Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('transitions view from Auth to Dashboard after user logs in', async () => {
    // First render: User is unauthenticated (useAuth returns null user)
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      profile: null,
      view: 'dashboard',
      authError: null,
      authLoading: false,
    } as any);

    const { rerender } = render(<App />);

    // Since it initialises with splash screen, let's click to close it
    const dismissSplash = screen.getByRole('button', { name: /Click window or press any key to start/i || /any key to start/i || /Dismiss/i });
    fireEvent.click(dismissSplash);

    await waitFor(() => {
      expect(screen.getByText('Scape Evaluator')).toBeInTheDocument();
    });

    // Rerender as if login completed (useAuth returns active user)
    vi.mocked(useAuth).mockReturnValue({
      user: { email: 'employee@scapesolutions.eu', uid: 'user-abc' },
      profile: { name: 'Sven Larsen', company: 'Scape', role: 'enduser', email: 'employee@scapesolutions.eu' },
      view: 'dashboard',
      authError: null,
      authLoading: false,
    } as any);

    rerender(<App />);

    // Dashboard view should now load and show projects list
    await waitFor(() => {
      expect(screen.getByText('Bin-Picking Projects')).toBeInTheDocument();
      expect(screen.getByText('Robot Project A')).toBeInTheDocument();
    });
  });
});
