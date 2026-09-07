import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuestionnaireView } from '../../src/views/QuestionnaireView';
import { ProjectState } from '../../src/types';

// Mock subcomponents
vi.mock('../../src/components/Header', () => ({
  Header: ({ projectName }: any) => <div data-testid="mock-header">Header: {projectName}</div>,
}));

vi.mock('../../src/components/ConfirmationModal', () => ({
  ConfirmationModal: () => <div data-testid="mock-confirmation-modal" />,
}));

vi.mock('../../src/components/AIAssistantTab', () => ({
  AIAssistantTab: () => <div data-testid="mock-ai-assistant-tab" />,
  isProposalAlreadyApplied: vi.fn().mockReturnValue(false),
}));

vi.mock('react-markdown', () => ({
  default: ({ children }: any) => <div data-testid="mock-markdown">{children}</div>,
}));

vi.mock('browser-image-compression', () => ({
  default: vi.fn(),
}));

describe('Evaluator Workflow Integration (UC5 & UC6)', () => {
  const mockUpdateDoc = vi.fn().mockResolvedValue(undefined);
  const mockDoc = vi.fn().mockReturnValue('mock-doc-ref');
  const mockLogChange = vi.fn().mockResolvedValue(undefined);
  const mockFetchProjects = vi.fn();
  const mockSetGlobalSuccess = vi.fn();
  const mockGenerateEvaluatorDraft = vi.fn().mockResolvedValue(undefined);
  const mockUpdateProjectField = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows evaluator to begin evaluation, lock project, generate draft, and publish verdict (UC6)', async () => {
    const submittedProject: ProjectState = {
      id: 'proj-eval-1',
      projectName: 'High Speed Packaging Line',
      status: 'submitted',
      isLocked: false,
      userId: 'client-1',
      report: 'AI user advice',
      fieldObservations: {},
      generalResponses: { '1.01': 'High Speed Packaging Line' },
      parts: [{ responses: { '2.01': 'Bottle Cap' }, images: [] }],
      finalVerdict: 'Feasible with Scape Mini 2.0 system and vacuum gripper.',
      isVerdictVisible: false,
    };

    const mockSetCurrentProject = vi.fn();

    render(
      <QuestionnaireView
        currentProject={submittedProject}
        setCurrentProject={mockSetCurrentProject}
        profile={{ isAdmin: true, name: 'Sven Evaluator', company: 'Scape Solutions', email: 'sven@scapesolutions.eu' }}
        setView={vi.fn()}
        currentStep={0}
        setCurrentStep={vi.fn()}
        activePartIndex={0}
        setActivePartIndex={vi.fn()}
        isReviewing={true}
        setIsReviewing={vi.fn()}
        activeCustomSection={null}
        setActiveCustomSection={vi.fn()}
        isGeneratingAdvice={false}
        isGeneratingDraft={false}
        isAssistantThinking={false}
        isSubmitting={false}
        saveProject={vi.fn()}
        toggleLock={vi.fn()}
        toggleVerdictVisibility={vi.fn()}
        setGlobalSuccess={mockSetGlobalSuccess}
        updateDoc={mockUpdateDoc}
        doc={mockDoc}
        db={{}}
        logChange={mockLogChange}
        fetchProjects={mockFetchProjects}
        generateExternalAdvice={vi.fn()}
        generateEvaluatorDraft={mockGenerateEvaluatorDraft}
        user={{ uid: 'admin-1', email: 'sven@scapesolutions.eu' }}
        logout={vi.fn()}
        switchMode={vi.fn()}
        isAllowedEvaluator={vi.fn().mockReturnValue(true)}
        isScapeEmployee={vi.fn().mockReturnValue(true)}
        saveProfile={vi.fn().mockResolvedValue(undefined)}
        sendMessageToAssistant={vi.fn().mockResolvedValue(undefined)}
        reviewTab="evaluation"
        setReviewTab={vi.fn()}
        updateProjectField={mockUpdateProjectField}
        handleAppError={vi.fn()}
        fetchProjectImages={vi.fn().mockImplementation((p) => Promise.resolve(p))}
      />
    );

    // 1. Evaluator clicks "Begin Evaluation (Lock Project)"
    const beginBtn = screen.getByRole('button', { name: /Begin Evaluation \(Lock Project\)/i });
    expect(beginBtn).toBeInTheDocument();
    fireEvent.click(beginBtn);

    await waitFor(() => {
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        expect.objectContaining({
          isLocked: true,
          takenBy: 'sven@scapesolutions.eu',
        })
      );
      expect(mockLogChange).toHaveBeenCalledWith('proj-eval-1', expect.stringContaining('Evaluation started'));
    });

    // 2. Evaluator clicks "Generate Evaluator Draft"
    const generateDraftBtn = screen.getByRole('button', { name: /Generate Evaluator Draft/i });
    expect(generateDraftBtn).toBeInTheDocument();
    fireEvent.click(generateDraftBtn);
    expect(mockGenerateEvaluatorDraft).toHaveBeenCalled();

    // 3. Evaluator clicks "Publish Verdict to User"
    const publishBtn = screen.getByRole('button', { name: /Publish Verdict to User/i });
    expect(publishBtn).toBeInTheDocument();
    fireEvent.click(publishBtn);

    await waitFor(() => {
      expect(mockUpdateProjectField).toHaveBeenCalledWith(
        submittedProject,
        'isVerdictVisible',
        true,
        expect.any(String)
      );
    });
  });

  it('allows evaluator to review and approve partner unlock request (UC5)', async () => {
    const lockedWithRequest: ProjectState = {
      id: 'proj-unlock-1',
      projectName: 'Welding Line Bin Project',
      status: 'submitted',
      isLocked: true,
      editRequestPending: true,
      editRequestReason: 'Need to update robot to KUKA KR16',
      userId: 'client-1',
      generalResponses: {},
      parts: [{ responses: {}, images: [] }],
    };

    const mockSetCurrentProject = vi.fn();

    render(
      <QuestionnaireView
        currentProject={lockedWithRequest}
        setCurrentProject={mockSetCurrentProject}
        profile={{ isAdmin: true, name: 'Sven Evaluator', company: 'Scape Solutions', email: 'sven@scapesolutions.eu' }}
        setView={vi.fn()}
        currentStep={0}
        setCurrentStep={vi.fn()}
        activePartIndex={0}
        setActivePartIndex={vi.fn()}
        isReviewing={true}
        setIsReviewing={vi.fn()}
        activeCustomSection={null}
        setActiveCustomSection={vi.fn()}
        isGeneratingAdvice={false}
        isGeneratingDraft={false}
        isAssistantThinking={false}
        isSubmitting={false}
        saveProject={vi.fn()}
        toggleLock={vi.fn()}
        toggleVerdictVisibility={vi.fn()}
        setGlobalSuccess={mockSetGlobalSuccess}
        updateDoc={mockUpdateDoc}
        doc={mockDoc}
        db={{}}
        logChange={mockLogChange}
        fetchProjects={mockFetchProjects}
        generateExternalAdvice={vi.fn()}
        generateEvaluatorDraft={mockGenerateEvaluatorDraft}
        user={{ uid: 'admin-1', email: 'sven@scapesolutions.eu' }}
        logout={vi.fn()}
        switchMode={vi.fn()}
        isAllowedEvaluator={vi.fn().mockReturnValue(true)}
        isScapeEmployee={vi.fn().mockReturnValue(true)}
        saveProfile={vi.fn().mockResolvedValue(undefined)}
        sendMessageToAssistant={vi.fn().mockResolvedValue(undefined)}
        reviewTab="evaluation"
        setReviewTab={vi.fn()}
        updateProjectField={mockUpdateProjectField}
        handleAppError={vi.fn()}
        fetchProjectImages={vi.fn().mockImplementation((p) => Promise.resolve(p))}
      />
    );

    // Pending banner is shown with reason
    expect(screen.getByText('Unlock Request Pending')).toBeInTheDocument();
    expect(screen.getByText(/Need to update robot to KUKA KR16/i)).toBeInTheDocument();

    // Click "Approve & Unlock"
    const approveUnlockBtn = screen.getByRole('button', { name: /Approve & Unlock/i });
    expect(approveUnlockBtn).toBeInTheDocument();
    fireEvent.click(approveUnlockBtn);

    await waitFor(() => {
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        expect.objectContaining({
          status: 'draft',
          isLocked: false,
          editRequestPending: false,
        })
      );
      expect(mockLogChange).toHaveBeenCalledWith(
        'proj-unlock-1',
        expect.stringContaining('Unlock request APPROVED')
      );
      expect(mockSetGlobalSuccess).toHaveBeenCalledWith(
        expect.stringContaining('Project unlocked & reverted to draft')
      );
    });
  });
});
