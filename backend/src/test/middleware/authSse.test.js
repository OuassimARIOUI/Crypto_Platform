import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock firebase admin
vi.mock('../../services/firebaseAdmin.js', () => ({
    default: {
        auth: vi.fn(() => ({
            verifyIdToken: vi.fn(),
        })),
    },
}));

// Mock prisma
vi.mock('../../services/dbService.js', () => ({
    prisma: {
        users: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
    },
}));

import admin from '../../services/firebaseAdmin.js';
import { prisma } from '../../services/dbService.js';
import { authSse } from '../../middleware/authSse.js';

function createMockReqRes(overrides = {}) {
    const req = {
        query: {},
        ...overrides,
    };
    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    };
    const next = vi.fn();
    return { req, res, next };
}

describe('authSse middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('token validation', () => {
        it('returns 401 when token is missing', async () => {
            const { req, res, next } = createMockReqRes({ query: {} });
            
            await authSse(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Token manquant' });
            expect(next).not.toHaveBeenCalled();
        });

        it('returns 401 when token is empty string', async () => {
            const { req, res, next } = createMockReqRes({ query: { token: '' } });
            
            await authSse(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Token manquant' });
        });
    });

    describe('Firebase token verification', () => {
        it('successfully authenticates with valid token via firebase_uid', async () => {
            const mockUser = { id: 1, firebase_uid: 'firebase123', role: 'user' };
            
            admin.auth.mockReturnValue({
                verifyIdToken: vi.fn().mockResolvedValue({ uid: 'firebase123', email: 'test@example.com' }),
            });
            prisma.users.findUnique.mockResolvedValue(mockUser);

            const { req, res, next } = createMockReqRes({ query: { token: 'valid_token' } });
            
            await authSse(req, res, next);

            expect(req.dbUser).toEqual(mockUser);
            expect(req.userId).toBe(1);
            expect(req.userRole).toBe('user');
            expect(next).toHaveBeenCalled();
        });

        it('finds user by email and links firebase_uid', async () => {
            const mockUser = { id: 1, firebase_uid: null, role: 'user', email: 'test@example.com' };
            const updatedUser = { ...mockUser, firebase_uid: 'firebase123' };
            
            admin.auth.mockReturnValue({
                verifyIdToken: vi.fn().mockResolvedValue({ uid: 'firebase123', email: 'test@example.com' }),
            });
            prisma.users.findUnique
                .mockResolvedValueOnce(null) // First call with firebase_uid
                .mockResolvedValueOnce(mockUser); // Second call with email
            prisma.users.update.mockResolvedValue(updatedUser);

            const { req, res, next } = createMockReqRes({ query: { token: 'valid_token' } });
            
            await authSse(req, res, next);

            expect(prisma.users.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { firebase_uid: 'firebase123' },
            });
            expect(next).toHaveBeenCalled();
        });

        it('returns 404 when user not found', async () => {
            admin.auth.mockReturnValue({
                verifyIdToken: vi.fn().mockResolvedValue({ uid: 'firebase123', email: 'test@example.com' }),
            });
            prisma.users.findUnique.mockResolvedValue(null);

            const { req, res, next } = createMockReqRes({ query: { token: 'valid_token' } });
            
            await authSse(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
        });

        it('returns 401 with TOKEN_EXPIRED code when token expired', async () => {
            admin.auth.mockReturnValue({
                verifyIdToken: vi.fn().mockRejectedValue({ code: 'auth/id-token-expired' }),
            });

            const { req, res, next } = createMockReqRes({ query: { token: 'expired_token' } });
            
            await authSse(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Token expired',
                code: 'TOKEN_EXPIRED',
            });
        });

        it('returns 401 with TOKEN_REVOKED code when token revoked', async () => {
            admin.auth.mockReturnValue({
                verifyIdToken: vi.fn().mockRejectedValue({ code: 'auth/id-token-revoked' }),
            });

            const { req, res, next } = createMockReqRes({ query: { token: 'revoked_token' } });
            
            await authSse(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Token revoked',
                code: 'TOKEN_REVOKED',
            });
        });

        it('returns 401 for invalid token', async () => {
            admin.auth.mockReturnValue({
                verifyIdToken: vi.fn().mockRejectedValue(new Error('Invalid token')),
            });

            const { req, res, next } = createMockReqRes({ query: { token: 'invalid_token' } });
            
            await authSse(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Token invalide' });
        });
    });
});
