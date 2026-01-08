import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock firebase module
vi.mock('../firebase', () => ({
    auth: {
        currentUser: null,
        signOut: vi.fn(),
    },
    isFirebaseConfigured: true,
}));

import { auth, isFirebaseConfigured } from '../firebase';

// Import after mocking
const tokenManagerModule = await import('../tokenManager');
const {
    getValidToken,
    clearAuth,
    startTokenRefresh,
    stopTokenRefresh,
    makeAuthenticatedRequest,
} = tokenManagerModule;

describe('tokenManager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        global.fetch = vi.fn();
        
        // Reset localStorage mock
        Object.defineProperty(window, 'localStorage', {
            value: {
                clear: vi.fn(),
            },
            writable: true,
        });
        Object.defineProperty(window, 'sessionStorage', {
            value: {
                clear: vi.fn(),
            },
            writable: true,
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        stopTokenRefresh();
    });

    describe('getValidToken', () => {
        it('returns null when no current user', async () => {
            auth.currentUser = null;

            const token = await getValidToken();

            expect(token).toBeNull();
        });

        it('returns token when user exists', async () => {
            auth.currentUser = {
                getIdToken: vi.fn().mockResolvedValue('valid-token'),
            };

            const token = await getValidToken();

            expect(token).toBe('valid-token');
        });

        it('returns null on error', async () => {
            auth.currentUser = {
                getIdToken: vi.fn().mockRejectedValue(new Error('Token error')),
            };

            const token = await getValidToken();

            expect(token).toBeNull();
        });
    });

    describe('clearAuth', () => {
        it('clears storage', async () => {
            await clearAuth();

            expect(window.localStorage.clear).toHaveBeenCalled();
            expect(window.sessionStorage.clear).toHaveBeenCalled();
        });

        it('signs out from Firebase when user exists', async () => {
            auth.currentUser = { uid: 'test' };
            auth.signOut = vi.fn().mockResolvedValue(undefined);

            await clearAuth();

            expect(auth.signOut).toHaveBeenCalled();
        });

        it('handles signOut error gracefully', async () => {
            auth.currentUser = { uid: 'test' };
            auth.signOut = vi.fn().mockRejectedValue(new Error('Sign out failed'));

            // Should not throw
            await clearAuth();
        });
    });

    describe('startTokenRefresh', () => {
        it('does nothing when Firebase not configured', () => {
            const callback = vi.fn();
            
            // This should not throw
            startTokenRefresh(callback);
            
            vi.advanceTimersByTime(60 * 60 * 1000);
        });

        it('refreshes token at interval', async () => {
            const callback = vi.fn();
            auth.currentUser = {
                getIdToken: vi.fn().mockResolvedValue('refreshed-token'),
            };

            startTokenRefresh(callback);
            
            // Advance by 50 minutes
            await vi.advanceTimersByTimeAsync(50 * 60 * 1000);

            expect(callback).toHaveBeenCalledWith('refreshed-token');
        });
    });

    describe('stopTokenRefresh', () => {
        it('stops the refresh interval', () => {
            const callback = vi.fn();
            auth.currentUser = {
                getIdToken: vi.fn().mockResolvedValue('token'),
            };

            startTokenRefresh(callback);
            stopTokenRefresh();
            
            vi.advanceTimersByTime(60 * 60 * 1000);

            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('makeAuthenticatedRequest', () => {
        it('throws when no token available', async () => {
            auth.currentUser = null;

            await expect(
                makeAuthenticatedRequest('http://test.com/api')
            ).rejects.toThrow('No valid token available');
        });

        it('makes request with auth header', async () => {
            auth.currentUser = {
                getIdToken: vi.fn().mockResolvedValue('auth-token'),
            };
            global.fetch.mockResolvedValueOnce({
                status: 200,
                ok: true,
            });

            await makeAuthenticatedRequest('http://test.com/api');

            expect(global.fetch).toHaveBeenCalledWith(
                'http://test.com/api',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Bearer auth-token',
                    }),
                })
            );
        });

        it('retries with fresh token on 401', async () => {
            let callCount = 0;
            auth.currentUser = {
                getIdToken: vi.fn().mockImplementation(() => {
                    callCount++;
                    return Promise.resolve(callCount === 1 ? 'old-token' : 'new-token');
                }),
            };
            global.fetch
                .mockResolvedValueOnce({ status: 401 })
                .mockResolvedValueOnce({ status: 200, ok: true });

            await makeAuthenticatedRequest('http://test.com/api');

            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        it('does not retry if token unchanged', async () => {
            auth.currentUser = {
                getIdToken: vi.fn().mockResolvedValue('same-token'),
            };
            global.fetch.mockResolvedValue({ status: 401 });

            const response = await makeAuthenticatedRequest('http://test.com/api');

            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(401);
        });

        it('passes custom options', async () => {
            auth.currentUser = {
                getIdToken: vi.fn().mockResolvedValue('token'),
            };
            global.fetch.mockResolvedValueOnce({ status: 200 });

            await makeAuthenticatedRequest('http://test.com/api', {
                method: 'POST',
                body: JSON.stringify({ data: 'test' }),
            });

            expect(global.fetch).toHaveBeenCalledWith(
                'http://test.com/api',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ data: 'test' }),
                })
            );
        });
    });
});
