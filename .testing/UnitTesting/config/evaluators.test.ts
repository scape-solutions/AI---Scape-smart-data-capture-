import { describe, it, expect } from 'vitest';
import { isAllowedEvaluator, isSuperuser } from '../../../src/config/evaluators';


describe('evaluators config', () => {
  describe('isAllowedEvaluator', () => {
    it('should return false for empty or null emails', () => {
      expect(isAllowedEvaluator(null)).toBe(false);
      expect(isAllowedEvaluator(undefined)).toBe(false);
      expect(isAllowedEvaluator('')).toBe(false);
    });

    it('should return true for emails in the default allowed list case-insensitively', () => {
      const allowedList = ['rune.k.larsen@scapesolutions.eu'];

      expect(isAllowedEvaluator('rune.k.larsen@scapesolutions.eu', allowedList)).toBe(true);
      expect(isAllowedEvaluator('RUNE.K.LARSEN@scapesolutions.eu', allowedList)).toBe(true);
    });

    it('should return true if email exists in custom allowed list', () => {
      expect(isAllowedEvaluator('test@example.com', ['test@example.com', 'other@example.com'])).toBe(true);
    });

    it('should return false for unauthorized emails', () => {
      expect(isAllowedEvaluator('random@user.com')).toBe(false);
    });
  });

  describe('isSuperuser', () => {
    it('should return false for empty or null emails', () => {
      expect(isSuperuser(null)).toBe(false);
      expect(isSuperuser(undefined)).toBe(false);
      expect(isSuperuser('')).toBe(false);
    });

    it('should return true for emails in default superuser list', () => {
      const superuserList = ['rune.k.larsen@scapesolutions.eu'];

      expect(isSuperuser('rune.k.larsen@scapesolutions.eu', superuserList)).toBe(true);
      expect(isSuperuser('RUNE.K.LARSEN@scapesolutions.eu', superuserList)).toBe(true);
    });

    it('should return true if email exists in custom superuser list', () => {
      expect(isSuperuser('admin@test.com', ['admin@test.com'])).toBe(true);
    });

    it('should return false for regular users', () => {
      expect(isSuperuser('regular@user.com')).toBe(false);
    });
  });
});
