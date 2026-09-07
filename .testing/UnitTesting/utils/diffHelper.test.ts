import { describe, it, expect } from 'vitest';
import { computeDataDiff, getCurrentResponsesSnapshot } from '../../../src/utils/diffHelper';
import { ProjectState } from '../../../src/types';

describe('diffHelper utilities', () => {
  describe('computeDataDiff', () => {
    it('returns empty array if no prior snapshot exists', () => {
      const project: ProjectState = {
        id: 'p-1',
        projectName: 'Test Proj',
        status: 'draft',
        userId: 'u-1',
        generalResponses: { '1.03': 'eu-pallet' },
        parts: [{ responses: { '2.01': 'Part A' }, images: [] }],
      };

      const diff = computeDataDiff(project);
      expect(diff).toEqual([]);
    });

    it('detects newly filled general responses', () => {
      const project: ProjectState = {
        id: 'p-1',
        projectName: 'Test Proj',
        status: 'draft',
        userId: 'u-1',
        lastAdviceResponsesSnapshot: {
          general: {},
          parts: [],
        },
        generalResponses: {
          '1.03': 'eu-pallet',
        },
        parts: [],
      };

      const diff = computeDataDiff(project);
      expect(diff.length).toBeGreaterThan(0);
      expect(diff[0]).toContain('Filled as "eu-pallet"');
    });

    it('detects updated and cleared general responses', () => {
      const project: ProjectState = {
        id: 'p-1',
        projectName: 'Test Proj',
        status: 'draft',
        userId: 'u-1',
        lastAdviceResponsesSnapshot: {
          general: {
            '1.03': 'eu-pallet',
            '1.05': 'Universal Robots',
          },
          parts: [],
        },
        generalResponses: {
          '1.03': 'gitterbox',
          '1.05': '',
        },
        parts: [],
      };

      const diff = computeDataDiff(project);
      const updatedChange = diff.find(d => d.includes('[1.03]'));
      const clearedChange = diff.find(d => d.includes('[1.05]'));

      expect(updatedChange).toContain('Updated from "eu-pallet" to "gitterbox"');
      expect(clearedChange).toContain('Cleared (was "Universal Robots")');
    });

    it('detects changes in part responses', () => {
      const project: ProjectState = {
        id: 'p-1',
        projectName: 'Test Proj',
        status: 'draft',
        userId: 'u-1',
        lastAdviceResponsesSnapshot: {
          general: {},
          parts: [
            {
              responses: { '2.01': 'Old Part Name', '2.03': 1.5 },
            },
          ],
        },
        generalResponses: {},
        parts: [
          {
            responses: { '2.01': 'New Part Name', '2.03': 2.5 },
            images: [],
          },
        ],
      };

      const diff = computeDataDiff(project);
      expect(diff.some(d => d.includes('Updated from "Old Part Name" to "New Part Name"'))).toBe(true);
      expect(diff.some(d => d.includes('Updated from "1.5" to "2.5"'))).toBe(true);
    });
  });

  describe('getCurrentResponsesSnapshot', () => {
    it('creates a clean, detached snapshot of current responses and counts', () => {
      const project: ProjectState = {
        id: 'p-1',
        projectName: 'Test Proj',
        status: 'draft',
        userId: 'u-1',
        generalResponses: { '1.03': 'eu-pallet' },
        parts: [
          {
            responses: { '2.01': 'Nut' },
            images: ['img1', 'img2'],
            cadFile: { name: 'part.stl', size: 1024, type: 'stl', dataUrl: 'data:...' },
          },
        ],
      };

      const snapshot = getCurrentResponsesSnapshot(project);
      expect(snapshot.general).toEqual({ '1.03': 'eu-pallet' });
      expect(snapshot.parts).toHaveLength(1);
      expect(snapshot.parts[0].responses).toEqual({ '2.01': 'Nut' });
      expect(snapshot.parts[0].imagesCount).toBe(2);
      expect(snapshot.parts[0].hasCad).toBe(true);

      // Verify mutation safety (deep copy)
      project.generalResponses['1.03'] = 'mutated';
      expect(snapshot.general['1.03']).toBe('eu-pallet');
    });
  });
});
