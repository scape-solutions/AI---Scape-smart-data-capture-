import { describe, it, expect } from 'vitest';
import { GENERAL_STEPS, PART_STEPS } from '../../src/questionnaire';

// Mock Lucide react icons because they might fail in test runner
vi.mock('lucide-react', () => ({
  Settings2: {},
  Box: {},
  Maximize: {},
  Zap: {},
  Camera: {},
}));

describe('Questionnaire Schema', () => {
  it('should have general steps defined with correct structure', () => {
    expect(GENERAL_STEPS).toBeInstanceOf(Array);
    expect(GENERAL_STEPS.length).toBeGreaterThan(0);
    
    const firstStep = GENERAL_STEPS[0];
    expect(firstStep.id).toBe('general');
    expect(firstStep.scope).toBe('general');
    expect(firstStep.questions).toBeInstanceOf(Array);

    // Verify condition for 1.05_other
    const otherRobotQuestion = firstStep.questions.find(q => q.id === '1.05_other');
    expect(otherRobotQuestion).toBeDefined();
    expect(otherRobotQuestion?.condition).toBeDefined();
    
    if (otherRobotQuestion?.condition) {
      expect(otherRobotQuestion.condition({ '1.05': 'other' })).toBe(true);
      expect(otherRobotQuestion.condition({ '1.05': 'ur' })).toBe(false);
    }
  });

  it('should have part steps defined with correct structure', () => {
    expect(PART_STEPS).toBeInstanceOf(Array);
    expect(PART_STEPS.length).toBe(3); // Basics, characteristics, visual evidence

    // Verify condition for 2.10_temp (temperature issues)
    const characteristicsStep = PART_STEPS.find(s => s.id === 'surface');
    expect(characteristicsStep).toBeDefined();

    const tempQuestion = characteristicsStep?.questions.find(q => q.id === '2.10_temp');
    expect(tempQuestion).toBeDefined();
    expect(tempQuestion?.condition).toBeDefined();

    if (tempQuestion?.condition) {
      expect(tempQuestion.condition({ '2.10': true })).toBe(true);
      expect(tempQuestion.condition({ '2.10': false })).toBe(false);
    }
  });
});
