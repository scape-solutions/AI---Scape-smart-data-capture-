import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
  const mockSetGlobalSuccess = vi.fn();
  const mockUpdateDoc = vi.fn();
  const mockDoc = vi.fn();
  const mockDb = {};
  const mockLogChange = vi.fn();
  const mockGenerateExternalAdvice = vi.fn();
  const mockGenerateEvaluatorDraft = vi.fn();
  const mockUpdateProjectField = vi.fn().mockResolvedValue(undefined);

  const mockProject: ProjectState = {
    id: 'project-123',
    projectName: 'Feasibility Trial Project',
    status: 'draft',
    userId: 'u-123',
    generalResponses: {},
    parts: [{ responses: {}, images: [] }],
    report: 'AI Feasibility Advice Narrative',
    fieldObservations: {
      '1.03': { severity: 'warning', text: 'Bin dimensions might exceed limits' },
    },
    lastAdviceTimestamp: '01/01/2026, 10:00:00',
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
    activeCustomSection: null,
    setActiveCustomSection: vi.fn(),
    isGeneratingAdvice: false,
    isGeneratingDraft: false,
    isAssistantThinking: false,
    isSubmitting: false,
    saveProject: mockSaveProject,
    toggleLock: vi.fn(),
    toggleVerdictVisibility: vi.fn(),
    setGlobalSuccess: mockSetGlobalSuccess,
    updateDoc: mockUpdateDoc,
    doc: mockDoc,
    db: mockDb,
    logChange: mockLogChange,
    fetchProjects: vi.fn(),
    generateExternalAdvice: mockGenerateExternalAdvice,
    generateEvaluatorDraft: mockGenerateEvaluatorDraft,
    user: { uid: 'u-123' },
    logout: vi.fn(),
    switchMode: vi.fn(),
    isAllowedEvaluator: vi.fn().mockReturnValue(false),
    isScapeEmployee: vi.fn().mockReturnValue(false),
    saveProfile: vi.fn().mockResolvedValue(undefined),
    sendMessageToAssistant: vi.fn().mockResolvedValue(undefined),
    reviewTab: 'advice' as const,
    setReviewTab: vi.fn(),
    updateProjectField: mockUpdateProjectField,
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

  it('submits a draft project and creates a frozen snapshot of advice (UC4)', async () => {
    mockSaveProject.mockResolvedValue({ ...mockProject, status: 'submitted' });

    render(<QuestionnaireView {...baseProps} isReviewing={true} />);

    // Check submission guidance box is displayed
    expect(screen.getByText('Data Accuracy & Submission Guidance')).toBeInTheDocument();

    // Type optional submission comments
    const commentsArea = screen.getByPlaceholderText(/e\.g\. Parts are stacked horizontally/i);
    fireEvent.change(commentsArea, { target: { value: 'Urgent line setup' } });

    // Submit button should be present
    const submitBtn = screen.getByRole('button', { name: /Submit Project/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSaveProject).toHaveBeenCalledWith(
        'submitted',
        expect.objectContaining({
          status: 'submitted',
          userSubmittedReport: 'AI Feasibility Advice Narrative',
          userSubmittedObservations: expect.objectContaining({
            '1.03': expect.objectContaining({ severity: 'warning' }),
          }),
        })
      );
      expect(mockSetGlobalSuccess).toHaveBeenCalledWith(
        expect.stringContaining('Project successfully submitted')
      );
    });
  });

  it('allows direct unsubmit when project is submitted but not locked (UC4)', async () => {
    const submittedProject: ProjectState = {
      ...mockProject,
      status: 'submitted',
      isLocked: false,
    };
    mockSaveProject.mockResolvedValue({ ...submittedProject, status: 'draft' });

    render(
      <QuestionnaireView
        {...baseProps}
        currentProject={submittedProject}
        isReviewing={true}
      />
    );

    // Should display direct unsubmit button
    const unsubmitBtn = screen.getByRole('button', { name: /Submitted \(Click to Unsubmit\)/i });
    expect(unsubmitBtn).toBeInTheDocument();

    fireEvent.click(unsubmitBtn);

    await waitFor(() => {
      expect(mockSaveProject).toHaveBeenCalledWith('draft', submittedProject);
      expect(mockSetGlobalSuccess).toHaveBeenCalledWith(
        expect.stringContaining('submission cancelled')
      );
    });
  });

  it('displays Request Edit Permission when project is locked (UC5)', () => {
    const lockedProject: ProjectState = {
      ...mockProject,
      status: 'submitted',
      isLocked: true,
    };

    render(
      <QuestionnaireView
        {...baseProps}
        currentProject={lockedProject}
        isReviewing={true}
      />
    );

    expect(screen.getByRole('button', { name: /Request Edit Permission/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Submitted \(Click to Unsubmit\)/i })).not.toBeInTheDocument();
  });

  it('renders evaluator controls for admin in review tab (UC6)', () => {
    const submittedProject: ProjectState = {
      ...mockProject,
      status: 'submitted',
      isLocked: false,
    };

    render(
      <QuestionnaireView
        {...baseProps}
        profile={{ isAdmin: true, name: 'Engineer', company: 'Scape', email: 'eng@scape.eu' }}
        currentProject={submittedProject}
        isReviewing={true}
      />
    );

    // Evaluator should see "Begin Evaluation (Lock Project)" button
    expect(screen.getByRole('button', { name: /Begin Evaluation \(Lock Project\)/i })).toBeInTheDocument();

    // Evaluator AI Draft box header should be present
    expect(screen.getByText('Evaluator AI Draft')).toBeInTheDocument();

    // Final Verdict box should be present with Publish Verdict button
    expect(screen.getByText('Project Review from Scape Solutions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Publish Verdict to User/i })).toBeInTheDocument();
  });

  it('renders Business Case simulation parameters when activeCustomSection is business-case (UC8)', () => {
    render(
      <QuestionnaireView
        {...baseProps}
        activeCustomSection="business-case"
        isReviewing={false}
      />
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Business Case' })).toBeInTheDocument();
    expect(screen.getByText(/Draft Feature — Under Development/i)).toBeInTheDocument();
    expect(screen.getByText(/ROI Estimation Parameters \(Simulation\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Operator Hourly Labor Cost/i)).toBeInTheDocument();
    expect(screen.getByText(/Operating Shifts per Day/i)).toBeInTheDocument();
  });
});
