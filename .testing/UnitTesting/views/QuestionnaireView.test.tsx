import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuestionnaireView } from '../../../src/views/QuestionnaireView';
import { ProjectState } from '../../../src/types';

// Mock subcomponents
vi.mock('../../../src/components/Header', () => ({
  Header: ({ projectName }: any) => <div data-testid="mock-header">Header: {projectName}</div>,
}));

vi.mock('../../../src/components/ConfirmationModal', () => ({
  ConfirmationModal: () => <div data-testid="mock-confirmation-modal" />,
}));

vi.mock('../../../src/components/AIAssistantTab', () => ({
  AIAssistantTab: () => <div data-testid="mock-ai-assistant-tab" />,
  isProposalAlreadyApplied: vi.fn().mockReturnValue(false),
}));

vi.mock('react-markdown', () => ({
  default: ({ children }: any) => <div data-testid="mock-markdown">{children}</div>,
}));

// Mock browser-image-compression
vi.mock('browser-image-compression', () => ({
  default: vi.fn(),
}));

describe('QuestionnaireView', () => {
  const mockSaveProject = vi.fn();
  const mockSetCurrentProject = vi.fn();

  const mockProject: ProjectState = {
    id: 'project-123',
    projectName: 'Feasibility Trial Project',
    status: 'draft',
    userId: 'u-123',
    generalResponses: {},
    parts: [{ responses: {}, images: [] }],
  };

  const baseProps = {
    currentProject: mockProject,
    setCurrentProject: mockSetCurrentProject,
    profile: { isAdmin: false, name: 'User', company: 'Org', email: 'user@example.com' },
    setView: vi.fn(),
    currentStep: 0,
    setCurrentStep: vi.fn(),
    activePartIndex: 0,
    setActivePartIndex: vi.fn(),
    isReviewing: false,
    setIsReviewing: vi.fn(),
    isGeneratingAdvice: false,
    isGeneratingDraft: false,
    isAssistantThinking: false,
    isSubmitting: false,
    saveProject: mockSaveProject,
    toggleLock: vi.fn(),
    toggleVerdictVisibility: vi.fn(),
    setGlobalSuccess: vi.fn(),
    updateDoc: vi.fn(),
    doc: vi.fn(),
    db: vi.fn(),
    logChange: vi.fn(),
    fetchProjects: vi.fn(),
    generateExternalAdvice: vi.fn(),
    generateEvaluatorDraft: vi.fn(),
    user: { uid: 'u-123' },
    logout: vi.fn(),
    switchMode: vi.fn(),
    isAllowedEvaluator: vi.fn().mockReturnValue(false),
    isScapeEmployee: vi.fn().mockReturnValue(false),
    saveProfile: vi.fn().mockResolvedValue(undefined),
    sendMessageToAssistant: vi.fn().mockResolvedValue(undefined),
    reviewTab: 'advice' as const,
    setReviewTab: vi.fn(),
    updateProjectField: vi.fn().mockResolvedValue(undefined),
    handleAppError: vi.fn(),
    fetchProjectImages: vi.fn().mockImplementation((p) => Promise.resolve(p)),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page containing mock Header', () => {
    render(<QuestionnaireView {...baseProps} />);
    expect(screen.getByTestId('mock-header')).toHaveTextContent('Header: Feasibility Trial Project');
  });
});
