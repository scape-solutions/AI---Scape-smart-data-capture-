import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PromptsEditorModal } from '../../../src/components/PromptsEditorModal';
import { getFirestore } from 'firebase/firestore';
import '@testing-library/jest-dom/vitest';
// .testing/setup.ts
import '@testing-library/jest-dom/vitest';

// Mock raw markdown imports
vi.mock('../../../src/docs/externalAdvicePrompt.md?raw', () => ({ default: 'mock external advice' }));
vi.mock('../../../src/docs/evaluatorDraftPrompt.md?raw', () => ({ default: 'mock evaluator draft' }));
vi.mock('../../../src/docs/autoFillPrompt.md?raw', () => ({ default: 'mock auto fill' }));
vi.mock('../../../src/docs/observationsExtractionPrompt.md?raw', () => ({ default: 'mock observations extraction' }));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon" />,
  Save: () => <div data-testid="save-icon" />,
  FileText: () => <div data-testid="file-icon" />,
  Bot: () => <div data-testid="bot-icon" />,
  Sparkles: () => <div data-testid="sparkles-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  Download: () => <div data-testid="download-icon" />,
  Upload: () => <div data-testid="upload-icon" />,
  History: () => <div data-testid="history-icon" />,
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),  // initializes firebase
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
  setDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
  addDoc: vi.fn(),
}));

describe('PromptsEditorModal', () => {
  const mockClose = vi.fn();
  const mockSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when show is false', () => {
    const { container } = render(
      <PromptsEditorModal show={false} onClose={mockClose} setGlobalSuccess={mockSuccess} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders and switches tabs when show is true', () => {
    render(
      <PromptsEditorModal show={true} onClose={mockClose} setGlobalSuccess={mockSuccess} />
    );

    expect(screen.getByText('AI System Prompts Editor')).toBeInTheDocument();

    // Switch tabs to autoFill
    const chatTab = screen.getByRole('button', { name: /AI Chat Assistant/i, });

    fireEvent.click(chatTab);

    expect(chatTab).toHaveClass('bg-white');
    expect(chatTab).toHaveClass('text-slate-900');
    expect(chatTab).toHaveClass('shadow-sm');
  });
});
