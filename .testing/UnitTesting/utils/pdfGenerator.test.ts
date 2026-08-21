import { vi, describe, it, expect, beforeEach } from 'vitest';
import { generateProjectPdf } from '../../../src/utils/pdfGenerator';
import { ProjectState } from '../../../src/types';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Settings2: {},
  Box: {},
  Maximize: {},
  Zap: {},
  Camera: {},
}));

// Setup mock jspdf instance drawing functions
const mockPdf = {
  rect: vi.fn(),
  text: vi.fn(),
  line: vi.fn(),
  addPage: vi.fn(),
  setFont: vi.fn(),
  setFontSize: vi.fn(),
  setTextColor: vi.fn(),
  setFillColor: vi.fn(),
  setDrawColor: vi.fn(),
  addImage: vi.fn(),
  splitTextToSize: vi.fn((text, size) => Array.isArray(text) ? text : [text]),
  setPage: vi.fn(),
  save: vi.fn(),
};

vi.mock('jspdf', () => ({
  jsPDF: class {
    rect = mockPdf.rect;
    text = mockPdf.text;
    line = mockPdf.line;
    addPage = mockPdf.addPage;
    setFont = mockPdf.setFont;
    setFontSize = mockPdf.setFontSize;
    setTextColor = mockPdf.setTextColor;
    setFillColor = mockPdf.setFillColor;
    setDrawColor = mockPdf.setDrawColor;
    addImage = mockPdf.addImage;
    splitTextToSize = mockPdf.splitTextToSize;
    save = mockPdf.save;
    setPage = mockPdf.setPage;
    internal = {
      pages: { length: 3 },
    };
  },
}));

describe('generateProjectPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should construct a PDF report and save it', () => {
    const mockProject: ProjectState = {
      id: 'test-project-123',
      projectName: 'Test Bin Picking Project',
      status: 'approved',
      userId: 'user-001',
      report: 'All looks good.',
      generalResponses: {
        '1.03': 'eu-pallet',
        '1.04_w': 800,
        '1.04_l': 1200,
      },
      parts: [
        {
          responses: {
            '2.01': 'Standard Nut',
            '2.02': '10x10x5',
            '2.03': 0.1,
            '2.03_material': 'Steel',
            '2.06': true,
          },
          images: ['data:image/jpeg;base64,mock1'],
        },
      ],
      fieldObservations: {
        '1.03': { severity: 'warning', text: 'Large bin height can block cameras' },
      },
    };

    generateProjectPdf(mockProject);

    expect(mockSave).toHaveBeenCalledWith('scape_evaluation_test_bin_picking_project.pdf');
    expect(mockText).toHaveBeenCalledWith(expect.stringContaining('SCAPE BIN-PICKING EVALUATION'), expect.any(Number), expect.any(Number));
    expect(mockText).toHaveBeenCalledWith(expect.stringContaining('Test Bin Picking Project'), expect.any(Number), expect.any(Number));
    expect(mockAddImage).toHaveBeenCalled();
  });

  it('should handle image rendering errors gracefully', () => {
    mockAddImage.mockImplementation(() => {
      throw new Error('Image format error');
    });

    const mockProject: ProjectState = {
      id: 'test-project-err',
      projectName: 'Error Image Project',
      status: 'draft',
      userId: 'user-001',
      report: '',
      generalResponses: {},
      parts: [
        {
          responses: {
            '2.01': 'Part A',
          },
          images: ['corrupted_image_data'],
        },
      ],
    };

    generateProjectPdf(mockProject);

    // It should draw red placeholder box and text, rather than crashing
    expect(mockSetDrawColor).toHaveBeenCalledWith(239, 68, 68); // Scape Red error border
    expect(mockText).toHaveBeenCalledWith(expect.stringContaining('[Image Render Fail]'), expect.any(Number), expect.any(Number));
    expect(mockSave).toHaveBeenCalledWith('scape_evaluation_error_image_project.pdf');
  });
});
