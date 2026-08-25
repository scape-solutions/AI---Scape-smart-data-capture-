import { vi, describe, it, expect } from 'vitest';

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn().mockReturnValue({}),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn().mockReturnValue({}),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn().mockReturnValue({}),
  doc: vi.fn(),
  getDocFromServer: vi.fn().mockResolvedValue({}),
}));

describe('Firebase Service Init', () => {
  it('should initialize the app, db, and auth', async () => {
    // Dynamic import to trigger the firebase.ts initialization
    const firebaseModule = await import('../../../src/lib/firebase');
    
    expect(firebaseModule.db).toBeDefined();
    expect(firebaseModule.auth).toBeDefined();
  });
});
