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

describe('Submission and Unsubmit Lifecycle Integration (UC4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('completes the full flow: Draft -> Submit (with snapshot) -> Direct Unsubmit -> Reverted to Draft', async () => {
    let currentProjectState: ProjectState = {
      id: 'proj-lifecycle-1',
      projectName: 'Robotic Pick Pilot Case',
      status: 'draft',
      isLocked: false,
      userId: 'partner-1',
      report: 'AI Feasibility Advice text',
      fieldObservations: {
        '1.03': { severity: 'warning', text: 'Large bin height' },
      },
      lastAdviceTimestamp: '01/01/2026, 12:00:00',
      generalResponses: { '1.01': 'Robotic Pick Pilot Case' },
      parts: [{ responses: { '2.01': 'Shaft Part' }, images: [] }],
    };

    const mockSetGlobalSuccess = vi.fn();
    const mockSaveProject = vi.fn().mockImplementation(async (targetStatus: string, updatedProject: ProjectState) => {
      currentProjectState = {
        ...updatedProject,
        status: targetStatus as any,
      };
      return currentProjectState;
    });

    const mockSetCurrentProject = vi.fn().mockImplementation((p: ProjectState) => {
      currentProjectState = p;
    });

    // 1. Initial render in Submit tab (Draft state)
    const { rerender } = render(
      <QuestionnaireView
        currentProject={currentProjectState}
        setCurrentProject={mockSetCurrentProject}
        profile={{ isAdmin: false, name: 'Partner', company: 'Automation Inc', email: 'partner@auto.com' }}
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
        saveProject={mockSaveProject}
        toggleLock={vi.fn()}
        toggleVerdictVisibility={vi.fn()}
        setGlobalSuccess={mockSetGlobalSuccess}
        updateDoc={vi.fn()}
        doc={vi.fn()}
        db={{}}
        logChange={vi.fn()}
        fetchProjects={vi.fn()}
        generateExternalAdvice={vi.fn()}
        generateEvaluatorDraft={vi.fn()}
        user={{ uid: 'partner-1' }}
        logout={vi.fn()}
        switchMode={vi.fn()}
        isAllowedEvaluator={vi.fn().mockReturnValue(false)}
        isScapeEmployee={vi.fn().mockReturnValue(false)}
        saveProfile={vi.fn().mockResolvedValue(undefined)}
        sendMessageToAssistant={vi.fn().mockResolvedValue(undefined)}
        reviewTab="advice"
        setReviewTab={vi.fn()}
        updateProjectField={vi.fn().mockResolvedValue(undefined)}
        handleAppError={vi.fn()}
        fetchProjectImages={vi.fn().mockImplementation((p) => Promise.resolve(p))}
      />
    );

    // Verify initial "Submit Project" button is visible in draft
    const submitBtn = screen.getByRole('button', { name: /Submit Project/i });
    expect(submitBtn).toBeInTheDocument();

    // 2. Click "Submit Project"
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSaveProject).toHaveBeenCalledWith(
        'submitted',
        expect.objectContaining({
          status: 'submitted',
          userSubmittedReport: 'AI Feasibility Advice text',
          userSubmittedObservations: expect.objectContaining({
            '1.03': expect.objectContaining({ severity: 'warning' }),
          }),
        })
      );
    });

    // 3. Rerender with the submitted state
    rerender(
      <QuestionnaireView
        currentProject={currentProjectState}
        setCurrentProject={mockSetCurrentProject}
        profile={{ isAdmin: false, name: 'Partner', company: 'Automation Inc', email: 'partner@auto.com' }}
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
        saveProject={mockSaveProject}
        toggleLock={vi.fn()}
        toggleVerdictVisibility={vi.fn()}
        setGlobalSuccess={mockSetGlobalSuccess}
        updateDoc={vi.fn()}
        doc={vi.fn()}
        db={{}}
        logChange={vi.fn()}
        fetchProjects={vi.fn()}
        generateExternalAdvice={vi.fn()}
        generateEvaluatorDraft={vi.fn()}
        user={{ uid: 'partner-1' }}
        logout={vi.fn()}
        switchMode={vi.fn()}
        isAllowedEvaluator={vi.fn().mockReturnValue(false)}
        isScapeEmployee={vi.fn().mockReturnValue(false)}
        saveProfile={vi.fn().mockResolvedValue(undefined)}
        sendMessageToAssistant={vi.fn().mockResolvedValue(undefined)}
        reviewTab="advice"
        setReviewTab={vi.fn()}
        updateProjectField={vi.fn().mockResolvedValue(undefined)}
        handleAppError={vi.fn()}
        fetchProjectImages={vi.fn().mockImplementation((p) => Promise.resolve(p))}
      />
    );

    // Verify button switched to direct unsubmit button
    const unsubmitBtn = screen.getByRole('button', { name: /Submitted \(Click to Unsubmit\)/i });
    expect(unsubmitBtn).toBeInTheDocument();

    // 4. Click direct unsubmit to cancel submission
    fireEvent.click(unsubmitBtn);

    await waitFor(() => {
      expect(mockSaveProject).toHaveBeenLastCalledWith(
        'draft',
        expect.objectContaining({
          id: 'proj-lifecycle-1',
          projectName: 'Robotic Pick Pilot Case',
        })
      );
      expect(currentProjectState.status).toBe('draft');
    });
  });
});
