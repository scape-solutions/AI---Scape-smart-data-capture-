import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DashboardView } from '../../src/views/DashboardView';
import { ProjectState } from '../../src/types';

// Mock sub-components
vi.mock('../../src/components/ProjectCard', () => ({
  ProjectCard: ({ p }: any) => <div data-testid="project-card">{p.projectName}</div>,
}));

vi.mock('../../src/components/PromptsEditorModal', () => ({
  PromptsEditorModal: () => <div data-testid="prompts-modal" />,
}));

vi.mock('../../src/components/ActiveUsersModal', () => ({
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

describe('Project Creation Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders creation prompt and triggers create callback on clicks', async () => {
    const mockCreateNewProject = vi.fn();
    const initialProjects: ProjectState[] = [
      { id: '1', projectName: 'Existing Project', status: 'draft', userId: 'u-1', parts: [] },
    ];

    const { rerender } = render(
      <DashboardView
        projects={initialProjects}
        profile={{ isAdmin: false, name: 'User', company: 'Org', email: 'user@example.com' }}
        user={{ uid: 'u-1' }}
        sortBy="date"
        setSortBy={vi.fn()}
        filterStatus="all"
        setFilterStatus={vi.fn()}
        filterOrg=""
        setFilterOrg={vi.fn()}
        filterUser=""
        setFilterUser={vi.fn()}
        showInactive={false}
        setShowInactive={vi.fn()}
        createNewProject={mockCreateNewProject}
        openProject={vi.fn()}
        fetchLog={vi.fn()}
        deleteProject={vi.fn()}
        restoreProject={vi.fn()}
        toggleLock={vi.fn()}
        takeProject={vi.fn()}
        updateStatus={vi.fn()}
        toggleInactive={vi.fn()}
        isGeneratingDemo={false}
        isCleaningDemo={false}
        generateDemoProjects={vi.fn().mockResolvedValue(undefined)}
        cleanDemoProjects={vi.fn().mockResolvedValue(undefined)}
        acceptProject={vi.fn()}
        acceptAllPendingProjects={vi.fn()}
        importProjectsFromJson={vi.fn()}
        fetchProjectImages={vi.fn().mockImplementation((p) => Promise.resolve(p))}
        setGlobalSuccess={vi.fn()}
      />
    );

    // Initial list has only 1 project card
    expect(screen.getAllByTestId('project-card')).toHaveLength(1);

    // Click "New Project" button to trigger the onboarding creation
    const newBtn = screen.getByRole('button', { name: /New Project/i });
    fireEvent.click(newBtn);

    // Verify option dialog pops up
    expect(screen.getByText('Create New Project')).toBeInTheDocument();

    const blankBtn = screen.getByRole('button', { name: /Start from scratch/i });
    fireEvent.click(blankBtn);

    expect(mockCreateNewProject).toHaveBeenCalledWith(false); // withAI = false
  });
});
