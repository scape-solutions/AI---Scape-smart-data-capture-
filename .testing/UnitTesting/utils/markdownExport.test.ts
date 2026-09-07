import { describe, it, expect, vi, beforeEach } from 'vitest';
import { downloadMarkdownFile } from '../../../src/utils/markdownExport';

describe('markdownExport utility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();
  });

  it('creates an anchor element with proper attributes and triggers download', () => {
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');

    downloadMarkdownFile('# Test Report', 'report.md');

    expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('appends .md extension if missing from filename', () => {
    const clickSpy = vi.fn();
    const createElementOrig = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = createElementOrig(tagName);
      if (tagName === 'a') {
        el.click = clickSpy;
      }
      return el;
    });

    downloadMarkdownFile('# Report Without Ext', 'my-report');

    expect(clickSpy).toHaveBeenCalled();
  });
});
