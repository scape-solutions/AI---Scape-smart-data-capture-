import { describe, it, expect, vi } from 'vitest';
import { normalizeProject, isScapeEmployee } from '../../../src/hooks/useProjects';
import { ProjectState } from '../../../src/types';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Settings2: {},
  Box: {},
  Maximize: {},
  Zap: {},
  Camera: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  doc: vi.fn(),
  serverTimestamp: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  deleteDoc: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
}));

describe('useProjects utilities', () => {
  describe('normalizeProject', () => {
    it('normalizes empty project structure to fallbacks', () => {
      const raw = {};
      const normalized = normalizeProject(raw);
      expect(normalized.projectName).toBe('Untitled Project');
      expect(normalized.parts).toHaveLength(1);
      expect(normalized.parts[0].responses).toEqual({});
      expect(normalized.generalImages).toEqual([]);
      expect(normalized.status).toBe('draft');
    });

    it('preserves existing project values and maps default fields correctly', () => {
      const raw = {
        projectName: 'Custom Project A',
        status: 'approved',
        generalResponses: {
          '1.01': 'Custom Project A',
        },
        parts: [
          {
            responses: { '2.01': 'Part 1' },
            images: ['img1'],
          },
        ],
      };
      const normalized = normalizeProject(raw);
      expect(normalized.projectName).toBe('Custom Project A');
      expect(normalized.status).toBe('approved');
      expect(normalized.parts).toHaveLength(1);
      expect(normalized.parts[0].responses['2.01']).toBe('Part 1');
      expect(normalized.parts[0].images).toEqual(['img1']);
    });
  });
});
