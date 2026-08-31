import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  isScapeEmployee,
  isDynamicAllowedEvaluator,
  isDynamicSuperuser,
  getEffectiveAdminStatus,
  setGlobalAllowedConfigForTesting,
  useAuth
} from '../../../src/hooks/useAuth';
import { auth, db } from '../../../src/lib/firebase';

// Mock auth module from react-firebase-hooks or firebase directly
vi.mock('../../../src/lib/firebase', () => ({
  auth: {
    currentUser: null,
  },
  db: {},
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((authObj, cb) => {
    cb(null); // Initial state: logged out
    return vi.fn(); // Unsubscribe mock
  }),
  signOut: vi.fn().mockResolvedValue(undefined),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
  GoogleAuthProvider: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  onSnapshot: vi.fn(),
}));

describe('useAuth utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset currentUser mock state
    (auth as any).currentUser = null;
    setGlobalAllowedConfigForTesting(null);
  });

  describe('isScapeEmployee', () => {
    it('returns false when email is missing', () => {
      expect(isScapeEmployee(null)).toBe(false);
    });

    it('returns true for explicit test UID', () => {
      expect(isScapeEmployee(null, "PvdZWFVtE6YKsa16loWrUNwjuif1")).toBe(true);
    });

    it('returns true if email matches Scape solutions domain and user is verified', () => {
      (auth as any).currentUser = {
        providerData: [{ providerId: 'google.com' }],
        emailVerified: true,
      };
      expect(isScapeEmployee('employee@scapesolutions.eu')).toBe(true);
    });

    it('returns false if user has unverified identity for domain-based access', () => {
      (auth as any).currentUser = {
        providerData: [{ providerId: 'password' }],
        emailVerified: false,
      };
      expect(isScapeEmployee('employee@scapesolutions.eu')).toBe(false);
    });
  });

  describe('isDynamicAllowedEvaluator', () => {
    it('returns true for a dynamically allowed evaluator', () => {
      setGlobalAllowedConfigForTesting({
        allowedEvaluators: ['rune.k.larsen@scapesolutions.eu'],
      });

      expect(
        isDynamicAllowedEvaluator('rune.k.larsen@scapesolutions.eu')
      ).toBe(true);

      expect(
        isDynamicAllowedEvaluator('RUNE.K.LARSEN@scapesolutions.eu')
      ).toBe(true);
    });
  });

  describe('getEffectiveAdminStatus', () => {
    it('returns false for null profiles', () => {
      expect(getEffectiveAdminStatus(null)).toBe(false);
    });

    it('returns true for evaluator role matched with verified email', () => {
      (auth as any).currentUser = {
        providerData: [{ providerId: 'google.com' }],
        emailVerified: true,
      };

      setGlobalAllowedConfigForTesting({
        allowedEvaluators: ['rune.k.larsen@scapesolutions.eu'],
      });

      const profile = {
        name: 'Evaluator User',
        company: 'Scape',
        role: 'enduser' as const,
        email: 'rune.k.larsen@scapesolutions.eu',
        requestedRole: 'evaluator' as const,
        isAdmin: false,
      };

      expect(getEffectiveAdminStatus(profile)).toBe(true);
    });
  });
});
