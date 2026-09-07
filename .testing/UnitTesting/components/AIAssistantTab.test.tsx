import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AIAssistantTab, areValuesEqual, isProposalAlreadyApplied } from '../../../src/components/AIAssistantTab';
import { ProjectState } from '../../../src/types';
import '@testing-library/jest-dom/vitest';

// Mock dependencies
vi.mock('react-markdown', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<Record<string, any>>();
  return new Proxy(actual, {
    get: (target, prop) => {
      if (prop === 'then') return undefined;
      if (prop in target) return target[prop as string];
      return (props: any) => <div data-testid={`icon-${String(prop)}`} {...props} />;
    }
  });
});

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

    it('returns false for image actions so proposal action card is always shown', () => {
      expect(isProposalAlreadyApplied({ suggestedAction: 'assign_image' }, mockProject, 0)).toBe(false);
      expect(isProposalAlreadyApplied({ suggestedAction: 'move_image' }, mockProject, 0)).toBe(false);
      expect(isProposalAlreadyApplied({ suggestedAction: 'copy_image' }, mockProject, 0)).toBe(false);
      expect(isProposalAlreadyApplied({ suggestedAction: 'delete_image' }, mockProject, 0)).toBe(false);
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

  it('renders input area and mic button for voice memos', () => {
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

    expect(screen.getByPlaceholderText(/Describe project/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Record Voice Memo/i)).toBeInTheDocument();
  });
});
