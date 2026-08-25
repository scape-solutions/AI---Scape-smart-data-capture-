import { vi, describe, it, expect } from 'vitest';

// Mock fs and firebase APIs before importing the script
vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn().mockReturnValue('{"apiKey": "mock-key", "firestoreDatabaseId": "mock-db"}'),
  },
}));

const mockGetDocs = vi.fn();
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  getDocs: vi.fn((...args) => mockGetDocs(...args)),
}));

describe('check_corrupted_ids script', () => {
  it('should scan and log projects correctly', async () => {
    const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // Setup mock Firestore documents
    const mockDocs = [
      {
        id: 'proj-1',
        size: 2,
        data: () => ({
          projectName: 'Clean Project',
          userId: 'user-1',
          createdAt: { toDate: () => new Date('2026-08-01') },
        }),
      },
      {
        id: 'proj-2',
        data: () => ({
          id: 'polluted-id', // this makes it corrupted
          projectName: 'Polluted Project',
          userId: 'user-1',
          createdAt: '2026-08-02',
        }),
      },
    ];

    mockGetDocs.mockResolvedValue({
      size: mockDocs.length,
      docs: mockDocs,
    });

    // Import dynamically so the top-level main() is invoked during the test execution
    await import('../../src/check_corrupted_ids');

    expect(consoleLogMock).toHaveBeenCalledWith(expect.stringContaining('Scanning Firestore for projects'));
    expect(consoleLogMock).toHaveBeenCalledWith(expect.stringContaining('Polluted Document Found:'));
    expect(consoleLogMock).toHaveBeenCalledWith(expect.stringContaining('Total Projects in Database: 2'));
    expect(consoleLogMock).toHaveBeenCalledWith(expect.stringContaining('Projects polluted with internal \'id\' fields: 1'));

    consoleLogMock.mockRestore();
  });
});
