import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardView } from '../../../src/views/DashboardView';
import { ProjectState } from '../../../src/types';

// Mock sub-components
vi.mock('../../../src/components/ProjectCard', () => ({
  ProjectCard: ({ p, openProject }: any) => (
    <div data-testid="project-card">
      <span>{p.projectName}</span>
      <button onClick={() => openProject(p)}>Open</button>
    </div>
  ),
}));

vi.mock('../../../src/components/PromptsEditorModal', () => ({
  PromptsEditorModal: () => <div data-testid="prompts-modal" />,
}));

vi.mock('../../../src/components/ActiveUsersModal', () => ({
  ActiveUsersModal: () => <div data-testid="users-modal" />,
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
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
}));

describe('DashboardView', () => {
  const mockCreateNewProject = vi.fn();
  const mockOpenProject = vi.fn();

  const baseProps = {
    projects: [
      { id: '1', projectName: 'Robot Project A', status: 'draft', userId: 'u-1', parts: [] },
      { id: '2', projectName: 'Robot Project B', status: 'submitted', userId: 'u-2', parts: [] },
    ] as ProjectState[],
    profile: { isAdmin: true, name: 'Admin', company: 'Scape', email: 'admin@scape.dk' },
    user: { uid: 'u-1' },
    sortBy: 'date',
    setSortBy: vi.fn(),
    filterStatus: 'all',
    setFilterStatus: vi.fn(),
    filterOrg: '',
    setFilterOrg: vi.fn(),
    filterUser: '',
    setFilterUser: vi.fn(),
    showInactive: false,
    setShowInactive: vi.fn(),
    createNewProject: mockCreateNewProject,
    openProject: mockOpenProject,
    fetchLog: vi.fn(),
    deleteProject: vi.fn(),
    restoreProject: vi.fn(),
    toggleLock: vi.fn(),
    takeProject: vi.fn(),
    updateStatus: vi.fn(),
    toggleInactive: vi.fn(),
    isGeneratingDemo: false,
    isCleaningDemo: false,
    generateDemoProjects: vi.fn().mockResolvedValue(undefined),
    cleanDemoProjects: vi.fn().mockResolvedValue(undefined),
    acceptProject: vi.fn(),
    acceptAllPendingProjects: vi.fn(),
    importProjectsFromJson: vi.fn(),
    fetchProjectImages: vi.fn().mockImplementation((p) => Promise.resolve(p)),
    setGlobalSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders DashboardView header and project cards', () => {
    render(<DashboardView {...baseProps} />);
    expect(screen.getByText('Bin-Picking Projects')).toBeInTheDocument();
    
    const projectCards = screen.getAllByTestId('project-card');
    expect(projectCards).toHaveLength(2);
    expect(screen.getByText('Robot Project A')).toBeInTheDocument();
  });

  it('handles clicking the new project creation button', () => {
    render(<DashboardView {...baseProps} />);
    
    const newBtn = screen.getByRole('button', { name: /New Project/i });
    fireEvent.click(newBtn);
    
    // Renders the creation options modal first (Directly or with AI)
    expect(screen.getByText('Create New Project')).toBeInTheDocument();
  });
});
