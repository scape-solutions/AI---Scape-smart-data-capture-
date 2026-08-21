import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectCard } from '../../../src/components/ProjectCard';
import { ProjectState } from '../../../src/types';
// .testing/setup.ts
import '@testing-library/jest-dom/vitest';

// Mock dependencies
vi.mock('../../../src/utils/pdfGenerator', () => ({
  generateProjectPdf: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
  query: vi.fn(),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  ShieldCheck: () => <div data-testid="shield-icon" />,
  CheckCircle2: () => <div data-testid="check-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  History: () => <div data-testid="history-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  ChevronRight: () => <div data-testid="chevron-icon" />,
  User: () => <div data-testid="user-icon" />,
  RotateCcw: () => <div data-testid="restore-icon" />,
  Download: () => <div data-testid="download-icon" />,
  FileText: () => <div data-testid="file-icon" />,
  Check: () => <div data-testid="check-simple-icon" />,
  XCircle: () => <div data-testid="x-icon" />,
}));

describe('ProjectCard', () => {
  const mockOpenProject = vi.fn();
  const mockFetchLog = vi.fn();
  const mockDeleteProject = vi.fn();
  const mockRestoreProject = vi.fn();
  const mockToggleLock = vi.fn();
  const mockTakeProject = vi.fn();
  const mockUpdateStatus = vi.fn();
  const mockToggleInactive = vi.fn();
  const mockAcceptProject = vi.fn();
  const mockFetchProjectImages = vi.fn().mockImplementation((p) => Promise.resolve(p));

  const mockProject: ProjectState = {
    id: 'project-1',
    projectName: 'Alpha Robot Project',
    status: 'draft',
    userId: 'user-1',
    report: null,
    generalResponses: {
      '1.01': 'Alpha Robot Project',
    },
    parts: [
      {
        responses: {},
        images: [],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders project details and name', () => {
    render(
      <ProjectCard
        p={mockProject}
        profile={null}
        user={{ uid: 'user-1' }}
        openProject={mockOpenProject}
        fetchLog={mockFetchLog}
        deleteProject={mockDeleteProject}
        restoreProject={mockRestoreProject}
        toggleLock={mockToggleLock}
        takeProject={mockTakeProject}
        updateStatus={mockUpdateStatus}
        toggleInactive={mockToggleInactive}
        acceptProject={mockAcceptProject}
        fetchProjectImages={mockFetchProjectImages}
      />
    );

    expect(screen.getByText('Alpha Robot Project')).toBeInTheDocument();
    expect(screen.getByText(/Draft/i)).toBeInTheDocument();
  });

  it('triggers openProject on clicking Open', () => {
    render(
      <ProjectCard
        p={mockProject}
        profile={null}
        user={{ uid: 'user-1' }}
        openProject={mockOpenProject}
        fetchLog={mockFetchLog}
        deleteProject={mockDeleteProject}
        restoreProject={mockRestoreProject}
        toggleLock={mockToggleLock}
        takeProject={mockTakeProject}
        updateStatus={mockUpdateStatus}
        toggleInactive={mockToggleInactive}
        acceptProject={mockAcceptProject}
        fetchProjectImages={mockFetchProjectImages}
      />
    );

    const openBtn = screen.getByRole('button', { name: /Open Project/i });
    fireEvent.click(openBtn);
    expect(mockOpenProject).toHaveBeenCalledWith(mockProject);
  });
});
