import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies
vi.mock('../../services/dbService.js', () => ({
    prisma: {
        users: {
            count: vi.fn(),
            findMany: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        portfolio_transactions: {
            findMany: vi.fn(),
        },
        audit_logs: {
            findMany: vi.fn(),
        },
    },
}));

vi.mock('../../services/auditLogService.js', () => ({
    createAuditLog: vi.fn(),
}));

vi.mock('../../utils/dateDuration.js', () => ({
    addDurationToNow: vi.fn(),
}));

vi.mock('../../services/appSettingsService.js', () => ({
    getMaintenanceConfig: vi.fn(),
    setMaintenanceConfig: vi.fn(),
}));

vi.mock('../../services/messagesService.js', () => ({
    formatBanNoticeBody: vi.fn(),
    sendTaggedMessageToDirectConversation: vi.fn(),
}));

vi.mock('../../services/realtimeService.js', () => ({
    publishToRoles: vi.fn(),
    publishToUser: vi.fn(),
}));

import { prisma } from '../../services/dbService.js';
import { createAuditLog } from '../../services/auditLogService.js';
import { addDurationToNow } from '../../utils/dateDuration.js';
import { getMaintenanceConfig, setMaintenanceConfig } from '../../services/appSettingsService.js';
import { formatBanNoticeBody, sendTaggedMessageToDirectConversation } from '../../services/messagesService.js';
import { publishToRoles, publishToUser } from '../../services/realtimeService.js';
import {
    listUsersController,
    updateUserRoleController,
    banUserController,
    unbanUserController,
    getMaintenanceStatusController,
    setMaintenanceStatusController,
    getUserActivityController,
} from '../../controllers/admin.controller.js';

describe('admin.controller - Full Coverage', () => {
    let req, res;

    beforeEach(() => {
        vi.clearAllMocks();
        req = {
            query: {},
            params: {},
            body: {},
            userId: 1,
            userRole: 'admin',
        };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
    });

    describe('listUsersController', () => {
        it('lists users with default pagination', async () => {
            prisma.users.count.mockResolvedValue(2);
            prisma.users.findMany.mockResolvedValue([
                { id: 1, pseudo: 'user1', email: 'a@a.com', role: 'user', status: 'active', portfolio: { balance: 100, total_deposited: 50 } },
                { id: 2, pseudo: 'user2', email: 'b@b.com', role: 'admin', status: 'active', portfolio: { balance: 200, total_deposited: 100 } },
            ]);

            await listUsersController(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                page: 1,
                pageSize: 20,
                total: 2,
                users: expect.any(Array),
            }));
        });

        it('filters by search query', async () => {
            req.query.search = 'test';
            prisma.users.count.mockResolvedValue(1);
            prisma.users.findMany.mockResolvedValue([
                { id: 1, pseudo: 'test', email: 'test@test.com', role: 'user', status: 'active', portfolio: null },
            ]);

            await listUsersController(req, res);

            expect(prisma.users.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    OR: expect.any(Array),
                }),
            }));
        });

        it('filters by role', async () => {
            req.query.role = 'admin';
            prisma.users.count.mockResolvedValue(1);
            prisma.users.findMany.mockResolvedValue([]);

            await listUsersController(req, res);

            expect(prisma.users.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ role: 'admin' }),
            }));
        });

        it('filters by status', async () => {
            req.query.status = 'banned';
            prisma.users.count.mockResolvedValue(0);
            prisma.users.findMany.mockResolvedValue([]);

            await listUsersController(req, res);

            expect(prisma.users.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ status: 'banned' }),
            }));
        });

        it('handles pagination', async () => {
            req.query.page = '2';
            req.query.pageSize = '10';
            prisma.users.count.mockResolvedValue(25);
            prisma.users.findMany.mockResolvedValue([]);

            await listUsersController(req, res);

            expect(prisma.users.findMany).toHaveBeenCalledWith(expect.objectContaining({
                skip: 10,
                take: 10,
            }));
        });

        it('limits pageSize to 100', async () => {
            req.query.pageSize = '200';
            prisma.users.count.mockResolvedValue(0);
            prisma.users.findMany.mockResolvedValue([]);

            await listUsersController(req, res);

            expect(prisma.users.findMany).toHaveBeenCalledWith(expect.objectContaining({
                take: 100,
            }));
        });

        it('moderator sees limited info for admins', async () => {
            req.userRole = 'moderator';
            prisma.users.count.mockResolvedValue(1);
            prisma.users.findMany.mockResolvedValue([
                { id: 1, pseudo: 'admin1', email: 'admin@test.com', role: 'admin', status: 'active', portfolio: { balance: 1000, total_deposited: 500 } },
            ]);

            await listUsersController(req, res);

            const response = res.json.mock.calls[0][0];
            expect(response.users[0].portfolio.balance).toBeNull();
        });
    });

    describe('updateUserRoleController', () => {
        it('updates user role successfully', async () => {
            req.params.id = '2';
            req.body.role = 'moderator';
            prisma.users.update.mockResolvedValue({
                id: 2, pseudo: 'user2', email: 'b@b.com', role: 'moderator', status: 'active', portfolio: {},
            });

            await updateUserRoleController(req, res);

            expect(prisma.users.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 2 },
                data: { role: 'moderator' },
            }));
            expect(createAuditLog).toHaveBeenCalled();
            expect(publishToRoles).toHaveBeenCalled();
            expect(publishToUser).toHaveBeenCalled();
        });

        it('returns 400 for invalid user id', async () => {
            req.params.id = 'invalid';
            req.body.role = 'user';

            await updateUserRoleController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid user id' });
        });

        it('returns 400 for invalid role', async () => {
            req.params.id = '2';
            req.body.role = 'admin'; // Only user or moderator allowed

            await updateUserRoleController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "Role must be 'user' or 'moderator'" });
        });
    });

    describe('banUserController', () => {
        it('bans user successfully', async () => {
            req.params.id = '2';
            req.body.reason = 'Violation of TOS';
            req.body.duration = { days: 7 };
            addDurationToNow.mockReturnValue(new Date('2025-01-15'));
            prisma.users.update.mockResolvedValue({
                id: 2, pseudo: 'user2', email: 'b@b.com', role: 'user', status: 'banned',
                banned_until: new Date('2025-01-15'), ban_reason: 'Violation of TOS', portfolio: {},
            });
            sendTaggedMessageToDirectConversation.mockResolvedValue({});

            await banUserController(req, res);

            expect(prisma.users.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    status: 'banned',
                    ban_reason: 'Violation of TOS',
                }),
            }));
            expect(createAuditLog).toHaveBeenCalled();
            expect(sendTaggedMessageToDirectConversation).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('returns 400 for invalid user id', async () => {
            req.params.id = 'abc';

            await banUserController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('handles messaging failure gracefully', async () => {
            req.params.id = '2';
            addDurationToNow.mockReturnValue(null);
            prisma.users.update.mockResolvedValue({
                id: 2, status: 'banned', portfolio: {},
            });
            sendTaggedMessageToDirectConversation.mockRejectedValue(new Error('Messaging failed'));

            // Should not throw
            await banUserController(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('truncates long ban reason', async () => {
            req.params.id = '2';
            req.body.reason = 'x'.repeat(600);
            addDurationToNow.mockReturnValue(null);
            prisma.users.update.mockResolvedValue({
                id: 2, status: 'banned', ban_reason: 'x'.repeat(500), portfolio: {},
            });

            await banUserController(req, res);

            expect(prisma.users.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    ban_reason: 'x'.repeat(500),
                }),
            }));
        });
    });

    describe('unbanUserController', () => {
        it('unbans user successfully', async () => {
            req.params.id = '2';
            prisma.users.update.mockResolvedValue({
                id: 2, status: 'active', banned_until: null, portfolio: {},
            });

            await unbanUserController(req, res);

            expect(prisma.users.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    status: 'active',
                    banned_until: null,
                }),
            }));
            expect(createAuditLog).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('returns 400 for invalid user id', async () => {
            req.params.id = '';

            await unbanUserController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('getMaintenanceStatusController', () => {
        it('returns maintenance status', async () => {
            getMaintenanceConfig.mockResolvedValue({
                enabled: true,
                message: 'Under maintenance',
                updatedAt: new Date(),
            });

            await getMaintenanceStatusController(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                enabled: true,
                message: 'Under maintenance',
            }));
        });
    });

    describe('setMaintenanceStatusController', () => {
        it('sets maintenance mode', async () => {
            req.body = { enabled: true, message: 'Scheduled maintenance' };
            setMaintenanceConfig.mockResolvedValue({
                enabled: true,
                message: 'Scheduled maintenance',
                updatedAt: new Date(),
            });

            await setMaintenanceStatusController(req, res);

            expect(setMaintenanceConfig).toHaveBeenCalledWith({
                enabled: true,
                message: 'Scheduled maintenance',
            });
            expect(createAuditLog).toHaveBeenCalled();
            expect(publishToRoles).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('returns 400 when enabled is not boolean', async () => {
            req.body = { enabled: 'yes' };

            await setMaintenanceStatusController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'enabled must be a boolean' });
        });
    });

    describe('getUserActivityController', () => {
        it('returns user activity', async () => {
            req.params.id = '2';
            prisma.portfolio_transactions.findMany.mockResolvedValue([
                { id: 1, type: 'buy', quantity: 0.5, price_usd: 50000, timestamp: new Date(), crypto: { symbol: 'btc', name: 'Bitcoin' } },
            ]);
            prisma.audit_logs.findMany.mockResolvedValue([
                { id: 1, action: 'LOGIN', created_at: new Date(), actor: { id: 2, pseudo: 'user2', role: 'user' }, target_user: null, metadata: {} },
            ]);

            await getUserActivityController(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                userId: 2,
                items: expect.any(Array),
            }));
        });

        it('returns 400 for invalid user id', async () => {
            req.params.id = 'abc';

            await getUserActivityController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('moderator cannot view admin activity', async () => {
            req.params.id = '2';
            req.userRole = 'moderator';
            prisma.users.findUnique.mockResolvedValue({ role: 'admin' });

            await getUserActivityController(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: 'Moderators cannot view admin activity' });
        });

        it('returns 404 if user not found (moderator check)', async () => {
            req.params.id = '999';
            req.userRole = 'moderator';
            prisma.users.findUnique.mockResolvedValue(null);

            await getUserActivityController(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('handles sell transactions', async () => {
            req.params.id = '2';
            prisma.portfolio_transactions.findMany.mockResolvedValue([
                { id: 1, type: 'sell', quantity: 1, price_usd: 3000, timestamp: new Date(), crypto: { symbol: 'eth', name: 'Ethereum' } },
            ]);
            prisma.audit_logs.findMany.mockResolvedValue([]);

            await getUserActivityController(req, res);

            const response = res.json.mock.calls[0][0];
            expect(response.items[0].action).toBe('SELL');
        });

        it('limits results', async () => {
            req.params.id = '2';
            req.query.limit = '5';
            prisma.portfolio_transactions.findMany.mockResolvedValue([]);
            prisma.audit_logs.findMany.mockResolvedValue([]);

            await getUserActivityController(req, res);

            expect(prisma.portfolio_transactions.findMany).toHaveBeenCalledWith(expect.objectContaining({
                take: 5,
            }));
        });
    });
});
