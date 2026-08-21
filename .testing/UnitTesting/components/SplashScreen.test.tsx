import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SplashScreen } from '../../../src/components/SplashScreen';
// .testing/setup.ts
import '@testing-library/jest-dom/vitest';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Bot: () => <div data-testid="bot-icon" />,
  Sparkles: () => <div data-testid="sparkles-icon" />,
  Fingerprint: () => <div data-testid="fingerprint-icon" />,
}));

describe('SplashScreen', () => {
  const mockClose = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    mockClose.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders content correctly', () => {
    render(<SplashScreen onClose={mockClose} />);
    expect(screen.getByText('Scape Solutions')).toBeInTheDocument();
    expect(screen.getByText(/Click window or press any key/i)).toBeInTheDocument();
  });

  it('triggers onClose after click and fade duration', () => {
    render(<SplashScreen onClose={mockClose} />);

    // Click the main card/container to dismiss
    const clickArea = screen.getByText('Scape Solutions').closest('div');
    expect(clickArea).not.toBeNull();
    if (clickArea) fireEvent.click(clickArea);

    expect(mockClose).not.toHaveBeenCalled();

    // Fast-forward timers
    vi.advanceTimersByTime(500);
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('dismisses when keydown event fires on window', () => {
    render(<SplashScreen onClose={mockClose} />);

    fireEvent.keyDown(window, { key: 'Enter' });
    vi.advanceTimersByTime(500);
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
