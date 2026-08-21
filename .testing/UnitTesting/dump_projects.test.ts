import { vi, describe, it, expect } from 'vitest';

const mockGet = vi.fn();
vi.mock('firebase-admin', () => ({
  default: {
    initializeApp: vi.fn(),
  },
}));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn().mockReturnValue({
    collection: vi.fn().mockReturnValue({
      get: vi.fn((...args) => mockGet(...args)),
    }),
  }),
}));

describe('dump_projects script', () => {
  it('should fetch and log project details correctly', async () => {
    const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => {});

    const mockDocs = [
      {
        id: 'proj-123',
        data: () => ({
          projectName: 'Evaluation Project 1',
          status: 'In Progress',
          userId: 'user-99',
          ownerEmail: 'user99@scape.dk',
          isLocked: true,
          isDemo: false,
          isDeleted: false,
        }),
      },
    ];

    mockGet.mockResolvedValue({
      docs: mockDocs,
    });

    // Import dynamically to trigger top-level script logic
    await import('../../src/dump_projects');

    expect(consoleLogMock).toHaveBeenCalledWith(expect.stringContaining('Fetching all projects from Firestore'));
    expect(consoleLogMock).toHaveBeenCalledWith(expect.stringContaining('- Project ID:   proj-123'));
    expect(consoleLogMock).toHaveBeenCalledWith(expect.stringContaining('Name:         "Evaluation Project 1"'));
    expect(consoleLogMock).toHaveBeenCalledWith(expect.stringContaining('Status:       In Progress'));
    expect(consoleLogMock).toHaveBeenCalledWith(expect.stringContaining('Locked:       true'));

    consoleLogMock.mockRestore();
  });
});
