import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AIAssistantTab, areValuesEqual, isProposalAlreadyApplied } from '../../../src/components/AIAssistantTab';
import { ProjectState } from '../../../src/types';
// .testing/setup.ts
import '@testing-library/jest-dom/vitest';

// Mock dependencies
vi.mock('react-markdown', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('lucide-react', () => ({
  Send: () => <div data-testid="send-icon" />,
  Bot: () => <div data-testid="bot-icon" />,
  User: () => <div data-testid="user-icon" />,
  Check: () => <div data-testid="check-icon" />,
  Edit2: () => <div data-testid="edit-icon" />,
  CheckCircle2: () => <div data-testid="checkcircle-icon" />,
  HelpCircle: () => <div data-testid="help-icon" />,
  Paperclip: () => <div data-testid="clip-icon" />,
  X: () => <div data-testid="x-icon" />,
  Settings2: () => <div data-testid="settings-icon" />,
  Box: () => <div data-testid="box-icon" />,
  Maximize: () => <div data-testid="maximize-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
  Camera: () => <div data-testid="camera-icon" />,
}));

describe('AIAssistantTab utilities', () => {
  describe('areValuesEqual', () => {
    it('compares empty values as equal', () => {
      expect(areValuesEqual('', null)).toBe(true);
      expect(areValuesEqual(undefined, '')).toBe(true);
      expect(areValuesEqual(null, undefined)).toBe(true);
    });

    it('compares trimmed string and numbers correctly', () => {
      expect(areValuesEqual(5, '5')).toBe(true);
      expect(areValuesEqual('  hello  ', 'hello')).toBe(true);
      expect(areValuesEqual('yes', 'no')).toBe(false);
    });
  });

  describe('isProposalAlreadyApplied', () => {
    const mockProject: ProjectState = {
      id: 'p-1',
      projectName: 'Test Proj',
      status: 'draft',
      userId: 'u-1',
      generalResponses: {
        '1.03': 'eu-pallet',
      },
      parts: [
        {
          responses: {
            '2.01': 'Nut A',
          },
          images: [],
        },
      ],
    };

    it('returns true if proposal matches current project status', () => {
      const proposal = {
        generalResponses: {
          '1.03': 'eu-pallet',
        },
        parts: [
          {
            responses: {
              '2.01': 'Nut A',
            },
          },
        ],
      };
      expect(isProposalAlreadyApplied(proposal, mockProject, 0)).toBe(true);
    });

    it('returns false if proposal has different responses', () => {
      const proposal = {
        generalResponses: {
          '1.03': 'metal-solid',
        },
      };
      expect(isProposalAlreadyApplied(proposal, mockProject, 0)).toBe(false);
    });
  });
});

describe('AIAssistantTab render', () => {
  const mockProject: ProjectState = {
    id: 'p-123',
    projectName: 'Feasibility test',
    status: 'draft',
    userId: 'u-123',
    generalResponses: {},
    parts: [{ responses: {}, images: [] }],
    chatHistory: [
      { role: 'model', text: 'Hello, how can I assist you today?' },
    ],
  };

  it('renders chatbot history correctly', () => {
    render(
      <AIAssistantTab
        currentProject={mockProject}
        setCurrentProject={vi.fn()}
        sendMessageToAssistant={vi.fn().mockResolvedValue(undefined)}
        isGeneratingReport={false}
        updateProjectField={vi.fn().mockResolvedValue(undefined)}
        activePartIndex={0}
      />
    );

    expect(screen.getByText('Hello, how can I assist you today?')).toBeInTheDocument();
  });
});
