import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ProjectCard } from '../../../src/components/ProjectCard';
import { ProjectState } from '../../../src/types';
// .testing/setup.ts
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';

const mockProfile = {
  name: 'Test User',
  company: 'Test Company',
  email: 'test@example.com',
  role: 'enduser' as const,
  isAdmin: false,
};

const mockUser = {
  uid: 'user-1',
};

const mockProject: ProjectState = {
  id: 'project-1',
  projectName: 'Alpha Robot Project',
  generalResponses: {},
  parts: [
    {
      responses: {},
      images: [],
    },
  ],
  report: null,
  status: 'draft',
  userId: 'user-1',
};

const mockOpenProject = vi.fn();
const mockFetchLog = vi.fn();
const mockDeleteProject = vi.fn();
const mockRestoreProject = vi.fn();
const mockToggleLock = vi.fn();
const mockTakeProject = vi.fn();
const mockUpdateStatus = vi.fn();
const mockToggleInactive = vi.fn();
const mockAcceptProject = vi.fn();
const mockFetchProjectImages = vi.fn().mockResolvedValue(mockProject);

it('triggers openProject on clicking View Details', async () => {
  const user = userEvent.setup();

  render(
    <ProjectCard
      p={mockProject}
      profile={mockProfile}
      user={mockUser}
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

  const viewDetailsButton = screen.getByRole('button', {
    name: /View Details/i,
  });

  await user.click(viewDetailsButton);

  expect(mockOpenProject).toHaveBeenCalledTimes(1);
  expect(mockOpenProject).toHaveBeenCalledWith(mockProject);
});
// Mock dependencies
vi.mock('../../../src/utils/pdfGenerator', () => ({
  generateProjectPdf: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
  query: vi.fn(),
  getFirestore: vi.fn().mockReturnValue({}),
  doc: vi.fn(),
  getDocFromServer: vi.fn().mockResolvedValue({}),
}));

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();

  return {
    ...actual,
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
  };
});

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

  it('triggers openProject on clicking View Details', async () => {
    const user = userEvent.setup();

    render(
      <ProjectCard
        p={mockProject}
        profile={mockProfile}
        user={mockUser}
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

    await user.click(
      screen.getByRole('button', {
        name: /View Details/i,
      })
    );

    expect(mockOpenProject).toHaveBeenCalledWith(mockProject);
  });
});
