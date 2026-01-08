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

// Mock appSettingsService
vi.mock('../../services/appSettingsService.js', () => ({
    getMaintenanceConfig: vi.fn(),
}));

import admin from '../../services/firebaseAdmin.js';
import { prisma } from '../../services/dbService.js';
import { getMaintenanceConfig } from '../../services/appSettingsService.js';
import { maintenanceGuard } from '../../middleware/maintenance.js';

function createMockReqRes(overrides = {}) {
    const req = {
        path: '/api/test',
        originalUrl: '/api/test',
        headers: {},
        ...overrides,
    };
    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    };
    const next = vi.fn();
    return { req, res, next };
}

describe('maintenance middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when maintenance is disabled', () => {
        it('calls next() and allows request', async () => {
            getMaintenanceConfig.mockResolvedValue({ enabled: false });

            const { req, res, next } = createMockReqRes();
            await maintenanceGuard(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    describe('when maintenance is enabled', () => {
        it('allows /admin/maintenance path', async () => {
            getMaintenanceConfig.mockResolvedValue({ enabled: true, message: 'Site down' });

            const { req, res, next } = createMockReqRes({ path: '/admin/maintenance' });
            await maintenanceGuard(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('allows /auth/login path', async () => {
            getMaintenanceConfig.mockResolvedValue({ enabled: true, message: 'Site down' });

            const { req, res, next } = createMockReqRes({ path: '/auth/login' });
            await maintenanceGuard(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('allows /auth/firebase-login path', async () => {
            getMaintenanceConfig.mockResolvedValue({ enabled: true, message: 'Site down' });

            const { req, res, next } = createMockReqRes({ path: '/auth/firebase-login' });
            await maintenanceGuard(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('allows admin users to access any path', async () => {
            getMaintenanceConfig.mockResolvedValue({ enabled: true, message: 'Site down' });
            
            admin.auth.mockReturnValue({
                verifyIdToken: vi.fn().mockResolvedValue({ uid: 'admin_uid', email: 'admin@test.com' }),
            });
            prisma.users.findUnique.mockResolvedValue({
                id: 1,
                firebase_uid: 'admin_uid',
                role: 'admin',
            });

            const { req, res, next } = createMockReqRes({
                path: '/api/protected',
                headers: { authorization: 'Bearer valid_token' },
            });
            await maintenanceGuard(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('blocks non-admin users with 503 status', async () => {
            getMaintenanceConfig.mockResolvedValue({ enabled: true, message: 'Maintenance en cours' });
            
            admin.auth.mockReturnValue({
                verifyIdToken: vi.fn().mockResolvedValue({ uid: 'user_uid', email: 'user@test.com' }),
            });
            prisma.users.findUnique.mockResolvedValue({
                id: 2,
                firebase_uid: 'user_uid',
                role: 'user',
            });

            const { req, res, next } = createMockReqRes({
                path: '/api/protected',
                headers: { authorization: 'Bearer user_token' },
            });
            await maintenanceGuard(req, res, next);

            expect(res.status).toHaveBeenCalledWith(503);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Site en maintenance',
                maintenance: true,
                message: 'Maintenance en cours',
            });
        });

        it('blocks requests without auth header', async () => {
            getMaintenanceConfig.mockResolvedValue({ enabled: true, message: 'Down for updates' });

            const { req, res, next } = createMockReqRes({ path: '/api/protected' });
            await maintenanceGuard(req, res, next);

            expect(res.status).toHaveBeenCalledWith(503);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Site en maintenance',
                maintenance: true,
                message: 'Down for updates',
            });
        });

        it('blocks when token verification fails', async () => {
            getMaintenanceConfig.mockResolvedValue({ enabled: true, message: 'Updating' });
            
            admin.auth.mockReturnValue({
                verifyIdToken: vi.fn().mockRejectedValue(new Error('Invalid token')),
            });

            const { req, res, next } = createMockReqRes({
                path: '/api/protected',
                headers: { authorization: 'Bearer invalid_token' },
            });
            await maintenanceGuard(req, res, next);

            expect(res.status).toHaveBeenCalledWith(503);
        });

        it('blocks when user not found in database', async () => {
            getMaintenanceConfig.mockResolvedValue({ enabled: true, message: 'Updating' });
            
            admin.auth.mockReturnValue({
                verifyIdToken: vi.fn().mockResolvedValue({ uid: 'unknown_uid', email: 'unknown@test.com' }),
            });
            prisma.users.findUnique.mockResolvedValue(null);

            const { req, res, next } = createMockReqRes({
                path: '/api/protected',
                headers: { authorization: 'Bearer token' },
            });
            await maintenanceGuard(req, res, next);

            expect(res.status).toHaveBeenCalledWith(503);
        });

        it('links firebase_uid when user found by email', async () => {
            getMaintenanceConfig.mockResolvedValue({ enabled: true, message: 'Updating' });
            
            admin.auth.mockReturnValue({
                verifyIdToken: vi.fn().mockResolvedValue({ uid: 'new_uid', email: 'admin@test.com' }),
            });
            prisma.users.findUnique
                .mockResolvedValueOnce(null) // First call by firebase_uid
                .mockResolvedValueOnce({ id: 1, firebase_uid: null, role: 'admin' }); // By email
            prisma.users.update.mockResolvedValue({ id: 1, firebase_uid: 'new_uid', role: 'admin' });

            const { req, res, next } = createMockReqRes({
                path: '/api/protected',
                headers: { authorization: 'Bearer token' },
            });
            await maintenanceGuard(req, res, next);

            expect(prisma.users.update).toHaveBeenCalled();
            expect(next).toHaveBeenCalled();
        });
    });

    describe('error handling', () => {
        it('returns 503 when getMaintenanceConfig throws', async () => {
            getMaintenanceConfig.mockRejectedValue(new Error('Database error'));

            const { req, res, next } = createMockReqRes();
            await maintenanceGuard(req, res, next);

            expect(res.status).toHaveBeenCalledWith(503);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Site en maintenance',
                maintenance: true,
            }));
        });

        it('handles malformed authorization header', async () => {
            getMaintenanceConfig.mockResolvedValue({ enabled: true, message: 'Down' });

            const { req, res, next } = createMockReqRes({
                path: '/api/protected',
                headers: { authorization: 'malformed' },
            });
            await maintenanceGuard(req, res, next);

            expect(res.status).toHaveBeenCalledWith(503);
        });
    });
});
