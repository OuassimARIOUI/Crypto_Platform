import { describe, it, expect, vi } from 'vitest';

// Mock firebase modules to avoid actual Firebase initialization
vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({ currentUser: null })),
}));

import { auth, isFirebaseConfigured } from '../firebase';

describe('firebase module', () => {
    it('exports isFirebaseConfigured as a boolean', () => {
        expect(typeof isFirebaseConfigured).toBe('boolean');
    });

    it('exports auth value', () => {
        // auth is either null (if not configured) or an auth object
        const validAuth = auth === null || (typeof auth === 'object' && auth !== null);
        expect(validAuth).toBe(true);
    });

    it('auth is non-null when firebase is configured', () => {
        if (isFirebaseConfigured) {
            expect(auth).not.toBeNull();
        } else {
            // In test environment without API key, auth should be null
            expect(auth).toBeNull();
        }
    });

    it('isFirebaseConfigured is false when NEXT_PUBLIC_FIREBASE_API_KEY is not set', () => {
        // In test environment, the Firebase API key is not set
        // so isFirebaseConfigured should be false
        if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
            expect(isFirebaseConfigured).toBe(false);
        }
    });

    it('isFirebaseConfigured is true when NEXT_PUBLIC_FIREBASE_API_KEY is set', () => {
        // This test documents the expected behavior when the key is configured
        if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
            expect(isFirebaseConfigured).toBe(true);
        }
    });
});
