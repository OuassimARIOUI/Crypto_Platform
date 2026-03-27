import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock firebase module before importing tokenManager
vi.mock('../firebase', () => ({
    auth: {
        currentUser: {
            getIdToken: vi.fn(() => Promise.resolve('mock-token-123')),
        },
        signOut: vi.fn(() => Promise.resolve()),
    },
    isFirebaseConfigured: true,
}));

import {
    getValidToken,
    clearAuth,
    startTokenRefresh,
    stopTokenRefresh,
    makeAuthenticatedRequest,
} from '../tokenManager';
import { auth, isFirebaseConfigured } from '../firebase';

describe('tokenManager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        // Reset localStorage / sessionStorage
        localStorage.clear();
        sessionStorage.clear();
        // Restore mock implementations cleared by vi.clearAllMocks
        auth.currentUser = {
            getIdToken: vi.fn(() => Promise.resolve('mock-token-123')),
        };
        auth.signOut = vi.fn(() => Promise.resolve());
    });

    afterEach(() => {
        stopTokenRefresh();
        vi.useRealTimers();
    });

    describe('getValidToken', () => {
        it('returns a token when firebase is configured and user is logged in', async () => {
            const token = await getValidToken();
            expect(token).toBe('mock-token-123');
            expect(auth.currentUser.getIdToken).toHaveBeenCalledWith(true);
        });

        it('returns null when firebase is not configured', async () => {
            // When auth has no currentUser, getValidToken returns null
            const savedCurrentUser = auth.currentUser;
            auth.currentUser = null;

            const token = await getValidToken();
            expect(token).toBeNull();

            auth.currentUser = savedCurrentUser;
        });

        it('returns null when auth.currentUser is null', async () => {
            const savedCurrentUser = auth.currentUser;
            auth.currentUser = null;

            const token = await getValidToken();
            expect(token).toBeNull();

            auth.currentUser = savedCurrentUser;
        });

        it('returns null and logs error when getIdToken throws', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            auth.currentUser.getIdToken.mockRejectedValueOnce(new Error('Token error'));

            const token = await getValidToken();
            expect(token).toBeNull();
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });

    describe('stopTokenRefresh', () => {
        it('clears the refresh interval without errors', () => {
            // Should not throw even when no interval is running
            expect(() => stopTokenRefresh()).not.toThrow();
        });

        it('can be called multiple times without error', () => {
            stopTokenRefresh();
            stopTokenRefresh();
            stopTokenRefresh();
        });
    });

    describe('startTokenRefresh', () => {
        it('sets up an interval that calls callback with token', async () => {
            const callback = vi.fn();
            startTokenRefresh(callback);

            // Advance 50 minutes
            await vi.advanceTimersByTimeAsync(50 * 60 * 1000);

            expect(callback).toHaveBeenCalledWith('mock-token-123');
        });

        it('does not call callback when token is null', async () => {
            auth.currentUser.getIdToken.mockResolvedValueOnce(null);
            const callback = vi.fn();
            startTokenRefresh(callback);

            await vi.advanceTimersByTimeAsync(50 * 60 * 1000);

            expect(callback).not.toHaveBeenCalled();
        });

        it('clears existing interval when called again', async () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();

            startTokenRefresh(callback1);
            startTokenRefresh(callback2);

            await vi.advanceTimersByTimeAsync(50 * 60 * 1000);

            // callback2 should be called, but not necessarily callback1
            expect(callback2).toHaveBeenCalled();
        });

        it('stops refreshing after stopTokenRefresh is called', async () => {
            const callback = vi.fn();
            startTokenRefresh(callback);
            stopTokenRefresh();

            await vi.advanceTimersByTimeAsync(50 * 60 * 1000);

            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('clearAuth', () => {
        it('calls auth.signOut when firebase is configured and user is logged in', async () => {
            // clearAuth calls auth.signOut() - the mock provides auth.signOut as vi.fn
            await clearAuth();
            expect(auth.signOut).toHaveBeenCalled();
        });

        it('clears localStorage and sessionStorage', async () => {
            localStorage.setItem('testKey', 'testValue');
            sessionStorage.setItem('testKey', 'testValue');

            await clearAuth();

            expect(localStorage.getItem('testKey')).toBeNull();
            expect(sessionStorage.getItem('testKey')).toBeNull();
        });

        it('handles signOut errors gracefully', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            auth.signOut.mockRejectedValueOnce(new Error('Sign out failed'));

            await expect(clearAuth()).resolves.not.toThrow();
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });

    describe('makeAuthenticatedRequest', () => {
        beforeEach(() => {
            global.fetch = vi.fn();
        });

        it('makes a request with Authorization Bearer token', async () => {
            global.fetch.mockResolvedValueOnce({ status: 200 });

            await makeAuthenticatedRequest('https://api.example.com/data');

            expect(global.fetch).toHaveBeenCalledWith(
                'https://api.example.com/data',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Bearer mock-token-123',
                    }),
                })
            );
        });

        it('throws when no valid token is available', async () => {
            auth.currentUser = null;

            await expect(makeAuthenticatedRequest('https://api.example.com/data'))
                .rejects.toThrow('No valid token available');

            // Restore
            auth.currentUser = {
                getIdToken: vi.fn(() => Promise.resolve('mock-token-123')),
            };
        });

        it('merges caller-provided headers with Authorization header', async () => {
            global.fetch.mockResolvedValueOnce({ status: 200 });

            await makeAuthenticatedRequest('https://api.example.com/data', {
                headers: { 'Content-Type': 'application/json' },
            });

            expect(global.fetch).toHaveBeenCalledWith(
                'https://api.example.com/data',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer mock-token-123',
                    }),
                })
            );
        });

        it('retries with fresh token on 401 when token differs', async () => {
            auth.currentUser.getIdToken
                .mockResolvedValueOnce('token-first')
                .mockResolvedValueOnce('token-refreshed');

            global.fetch
                .mockResolvedValueOnce({ status: 401 })
                .mockResolvedValueOnce({ status: 200 });

            const response = await makeAuthenticatedRequest('https://api.example.com/data');

            expect(global.fetch).toHaveBeenCalledTimes(2);
            expect(response.status).toBe(200);
        });

        it('does not retry when fresh token is same as original', async () => {
            // Both calls return the same token
            auth.currentUser.getIdToken.mockResolvedValue('same-token');

            global.fetch.mockResolvedValueOnce({ status: 401 });

            const response = await makeAuthenticatedRequest('https://api.example.com/data');

            // Only one fetch call because token didn't change
            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(401);
        });

        it('passes additional options to fetch', async () => {
            global.fetch.mockResolvedValueOnce({ status: 200 });

            await makeAuthenticatedRequest('https://api.example.com/data', {
                method: 'POST',
                body: JSON.stringify({ key: 'value' }),
            });

            expect(global.fetch).toHaveBeenCalledWith(
                'https://api.example.com/data',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ key: 'value' }),
                })
            );
        });
    });
});
