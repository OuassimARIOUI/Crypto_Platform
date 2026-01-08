import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock prisma
vi.mock('../../services/dbService.js', () => ({
    prisma: {
        users: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            update: vi.fn(),
        },
    },
}));

// Mock discordService
vi.mock('../../services/discordService.js', () => ({
    getDiscordAuthorizeUrl: vi.fn(),
    exchangeCodeForDiscordIdentity: vi.fn(),
}));

import { prisma } from '../../services/dbService.js';
import { getDiscordAuthorizeUrl, exchangeCodeForDiscordIdentity } from '../../services/discordService.js';
import {
    getConnectUrlController,
    exchangeDiscordCodeController,
    disconnectDiscordController,
} from '../../controllers/discord.controller.js';

// Helper to create mock req/res
function createMockReqRes(overrides = {}) {
    const req = {
        userId: 1,
        body: {},
        query: {},
        params: {},
        ...overrides,
    };
    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    };
    return { req, res };
}

describe('discord.controller', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getConnectUrlController', () => {
        it('returns Discord authorization URL', async () => {
            const mockUrl = 'https://discord.com/oauth2/authorize?client_id=123';
            getDiscordAuthorizeUrl.mockReturnValue(mockUrl);

            const { req, res } = createMockReqRes();
            await getConnectUrlController(req, res);

            expect(res.json).toHaveBeenCalledWith({ url: mockUrl });
        });

        it('returns 500 on error', async () => {
            getDiscordAuthorizeUrl.mockImplementation(() => {
                throw new Error('Config error');
            });

            const { req, res } = createMockReqRes();
            await getConnectUrlController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Config error' });
        });

        it('returns generic error message when error has no message', async () => {
            getDiscordAuthorizeUrl.mockImplementation(() => {
                throw new Error();
            });

            const { req, res } = createMockReqRes();
            await getConnectUrlController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Failed to build Discord URL' });
        });
    });

    describe('exchangeDiscordCodeController', () => {
        it('returns 400 when code is missing', async () => {
            const { req, res } = createMockReqRes({ body: {} });
            await exchangeDiscordCodeController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'code is required' });
        });

        it('successfully links Discord account', async () => {
            const mockIdentity = { id: 'discord123', username: 'TestUser' };
            exchangeCodeForDiscordIdentity.mockResolvedValue(mockIdentity);
            prisma.users.findFirst.mockResolvedValue(null);
            prisma.users.update.mockResolvedValue({
                id: 1,
                discord_user_id: 'discord123',
                discord_username: 'TestUser',
            });

            const { req, res } = createMockReqRes({ body: { code: 'valid_code' } });
            await exchangeDiscordCodeController(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                user: expect.objectContaining({ discord_user_id: 'discord123' }),
            });
        });

        it('returns 409 when Discord account already linked to another user', async () => {
            const mockIdentity = { id: 'discord123', username: 'TestUser' };
            exchangeCodeForDiscordIdentity.mockResolvedValue(mockIdentity);
            prisma.users.findFirst.mockResolvedValue({ id: 2, pseudo: 'otheruser' });

            const { req, res } = createMockReqRes({ body: { code: 'valid_code' } });
            await exchangeDiscordCodeController(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                error: 'This Discord account (@TestUser) is already linked to another user.',
            });
        });

        it('handles unique constraint violation (P2002)', async () => {
            const mockIdentity = { id: 'discord123', username: 'TestUser' };
            exchangeCodeForDiscordIdentity.mockResolvedValue(mockIdentity);
            prisma.users.findFirst.mockResolvedValue(null);
            prisma.users.update.mockRejectedValue({
                code: 'P2002',
                meta: { target: ['discord_user_id'] },
            });

            const { req, res } = createMockReqRes({ body: { code: 'valid_code' } });
            await exchangeDiscordCodeController(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                error: 'This Discord account is already linked to another user.',
            });
        });

        it('returns 500 on general error', async () => {
            exchangeCodeForDiscordIdentity.mockRejectedValue(new Error('Discord API error'));

            const { req, res } = createMockReqRes({ body: { code: 'valid_code' } });
            await exchangeDiscordCodeController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Discord API error' });
        });
    });

    describe('disconnectDiscordController', () => {
        it('successfully disconnects Discord', async () => {
            prisma.users.update.mockResolvedValue({
                id: 1,
                discord_user_id: null,
                discord_connected_at: null,
            });

            const { req, res } = createMockReqRes();
            await disconnectDiscordController(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                user: expect.objectContaining({ discord_user_id: null }),
            });
        });

        it('returns 500 on error', async () => {
            prisma.users.update.mockRejectedValue(new Error('Database error'));

            const { req, res } = createMockReqRes();
            await disconnectDiscordController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
        });

        it('returns generic error when error has no message', async () => {
            prisma.users.update.mockRejectedValue(new Error());

            const { req, res } = createMockReqRes();
            await disconnectDiscordController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Failed to disconnect Discord' });
        });
    });
});
