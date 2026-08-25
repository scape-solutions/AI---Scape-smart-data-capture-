import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuestionnaireView } from '../../src/views/QuestionnaireView';
import { ProjectState } from '../../src/types';

// Mock sub-components
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

describe('Questionnaire Integration Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates project state when a form input changes', async () => {
    const mockUpdateProjectField = vi.fn().mockResolvedValue(undefined);
    const mockSetCurrentProject = vi.fn();

    const mockProject: ProjectState = {
      id: 'project-999',
      projectName: 'Prototype Project',
      status: 'draft',
      userId: 'u-1',
      generalResponses: {
        '1.01': 'Prototype Project',
      },
      parts: [
        {
          responses: {},
          images: [],
        },
      ],
    };

    render(
      <QuestionnaireView
        currentProject={mockProject}
        setCurrentProject={mockSetCurrentProject}
        profile={{ isAdmin: false, name: 'User', company: 'Org', email: 'user@example.com' }}
        setView={vi.fn()}
        currentStep={0} // Project & Cell Info
        setCurrentStep={vi.fn()}
        activePartIndex={0}
        setActivePartIndex={vi.fn()}
        isReviewing={false}
        setIsReviewing={vi.fn()}
        isGeneratingAdvice={false}
        isGeneratingDraft={false}
        isAssistantThinking={false}
        isSubmitting={false}
        saveProject={vi.fn().mockResolvedValue(mockProject)}
        toggleLock={vi.fn()}
        toggleVerdictVisibility={vi.fn()}
        setGlobalSuccess={vi.fn()}
        updateDoc={vi.fn()}
        doc={vi.fn()}
        db={vi.fn()}
        logChange={vi.fn()}
        fetchProjects={vi.fn()}
        generateExternalAdvice={vi.fn()}
        generateEvaluatorDraft={vi.fn()}
        user={{ uid: 'u-1' }}
        logout={vi.fn()}
        switchMode={vi.fn()}
        isAllowedEvaluator={vi.fn().mockReturnValue(false)}
        isScapeEmployee={vi.fn().mockReturnValue(false)}
        saveProfile={vi.fn().mockResolvedValue(undefined)}
        sendMessageToAssistant={vi.fn().mockResolvedValue(undefined)}
        reviewTab="advice"
        setReviewTab={vi.fn()}
        updateProjectField={mockUpdateProjectField}
        handleAppError={vi.fn()}
        fetchProjectImages={vi.fn().mockImplementation((p) => Promise.resolve(p))}
      />
    );

    // Verify first step input for Project Name is rendered
    const projectNameInput = screen.getByDisplayValue('Prototype Project');
    expect(projectNameInput).toBeInTheDocument();

    // Type a new project name
    fireEvent.change(projectNameInput, { target: { value: 'Updated Project Name' } });
    fireEvent.blur(projectNameInput);

    // Blur triggers save or update callback
    await waitFor(() => {
      expect(mockUpdateProjectField).toHaveBeenCalledWith(
        expect.any(Object),
        'projectName',
        'Updated Project Name',
        expect.any(String)
      );
    });
  });
});
