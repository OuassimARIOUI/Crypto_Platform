import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock prisma
vi.mock('../../services/dbService.js', () => ({
    prisma: {
        users: {
            findUnique: vi.fn(),
        },
    },
}));

// Mock messagesService
vi.mock('../../services/messagesService.js', () => ({
    listMyConversations: vi.fn(),
    startDirectConversationByPseudo: vi.fn(),
    getConversationMessages: vi.fn(),
    sendMessageToConversation: vi.fn(),
    getUnreadCount: vi.fn(),
}));

import { prisma } from '../../services/dbService.js';
import {
    listMyConversations,
    startDirectConversationByPseudo,
    getConversationMessages,
    sendMessageToConversation,
    getUnreadCount,
} from '../../services/messagesService.js';
import {
    listConversationsController,
    startDirectConversationController,
    listMessagesController,
    sendMessageController,
    unreadCountController,
} from '../../controllers/messages.controller.js';

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

describe('messages.controller', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('listConversationsController', () => {
        it('returns list of conversations', async () => {
            const mockConvos = [
                { id: 1, type: 'direct', participants: [] },
                { id: 2, type: 'direct', participants: [] },
            ];
            listMyConversations.mockResolvedValue(mockConvos);

            const { req, res } = createMockReqRes();
            await listConversationsController(req, res);

            expect(res.json).toHaveBeenCalledWith({ conversations: mockConvos });
        });

        it('returns empty array when no conversations', async () => {
            listMyConversations.mockResolvedValue([]);

            const { req, res } = createMockReqRes();
            await listConversationsController(req, res);

            expect(res.json).toHaveBeenCalledWith({ conversations: [] });
        });
    });

    describe('startDirectConversationController', () => {
        it('successfully starts a conversation', async () => {
            prisma.users.findUnique.mockResolvedValue({
                id: 1,
                role: 'user',
                pseudo: 'testuser',
            });
            startDirectConversationByPseudo.mockResolvedValue({
                id: 1,
                participants: [{ id: 1 }, { id: 2 }],
            });

            const { req, res } = createMockReqRes({ body: { pseudo: 'targetuser' } });
            await startDirectConversationController(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                conversation: expect.objectContaining({ id: 1 }),
            });
        });

        it('returns 404 when user not found', async () => {
            prisma.users.findUnique.mockResolvedValue(null);

            const { req, res } = createMockReqRes({ body: { pseudo: 'targetuser' } });
            await startDirectConversationController(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
        });

        it('returns 400 when service throws error', async () => {
            prisma.users.findUnique.mockResolvedValue({
                id: 1,
                role: 'user',
                pseudo: 'testuser',
            });
            startDirectConversationByPseudo.mockRejectedValue(new Error('Target user not found'));

            const { req, res } = createMockReqRes({ body: { pseudo: 'nonexistent' } });
            await startDirectConversationController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Target user not found' });
        });
    });

    describe('listMessagesController', () => {
        it('returns messages for conversation', async () => {
            const mockMessages = [
                { id: 1, body: 'Hello', sender: { id: 1 } },
                { id: 2, body: 'Hi', sender: { id: 2 } },
            ];
            getConversationMessages.mockResolvedValue(mockMessages);

            const { req, res } = createMockReqRes({ params: { id: '1' } });
            await listMessagesController(req, res);

            expect(res.json).toHaveBeenCalledWith({
                conversationId: 1,
                messages: mockMessages,
            });
        });

        it('uses limit from query', async () => {
            getConversationMessages.mockResolvedValue([]);

            const { req, res } = createMockReqRes({
                params: { id: '1' },
                query: { limit: '100' },
            });
            await listMessagesController(req, res);

            expect(getConversationMessages).toHaveBeenCalledWith({
                userId: 1,
                conversationId: 1,
                limit: 100,
            });
        });

        it('returns 403 for Access denied error', async () => {
            getConversationMessages.mockRejectedValue(new Error('Access denied'));

            const { req, res } = createMockReqRes({ params: { id: '1' } });
            await listMessagesController(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' });
        });

        it('returns 400 for other errors', async () => {
            getConversationMessages.mockRejectedValue(new Error('Invalid conversation'));

            const { req, res } = createMockReqRes({ params: { id: '1' } });
            await listMessagesController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid conversation' });
        });
    });

    describe('sendMessageController', () => {
        it('successfully sends a message', async () => {
            prisma.users.findUnique.mockResolvedValue({
                id: 1,
                role: 'user',
                pseudo: 'testuser',
            });
            const mockMessage = {
                id: 1,
                body: 'Hello',
                conversationId: 1,
                sender: { id: 1 },
            };
            sendMessageToConversation.mockResolvedValue(mockMessage);

            const { req, res } = createMockReqRes({
                params: { id: '1' },
                body: { body: 'Hello' },
            });
            await sendMessageController(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: mockMessage,
            });
        });

        it('returns 404 when user not found', async () => {
            prisma.users.findUnique.mockResolvedValue(null);

            const { req, res } = createMockReqRes({
                params: { id: '1' },
                body: { body: 'Hello' },
            });
            await sendMessageController(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
        });

        it('returns 403 for Access denied error', async () => {
            prisma.users.findUnique.mockResolvedValue({
                id: 1,
                role: 'user',
                pseudo: 'testuser',
            });
            sendMessageToConversation.mockRejectedValue(new Error('Access denied'));

            const { req, res } = createMockReqRes({
                params: { id: '1' },
                body: { body: 'Hello' },
            });
            await sendMessageController(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' });
        });

        it('returns 400 for other errors', async () => {
            prisma.users.findUnique.mockResolvedValue({
                id: 1,
                role: 'user',
                pseudo: 'testuser',
            });
            sendMessageToConversation.mockRejectedValue(new Error('Message is empty'));

            const { req, res } = createMockReqRes({
                params: { id: '1' },
                body: { body: '' },
            });
            await sendMessageController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Message is empty' });
        });
    });

    describe('unreadCountController', () => {
        it('returns unread count', async () => {
            getUnreadCount.mockResolvedValue(5);

            const { req, res } = createMockReqRes();
            await unreadCountController(req, res);

            expect(res.json).toHaveBeenCalledWith({ unreadCount: 5 });
        });

        it('returns 0 when no unread messages', async () => {
            getUnreadCount.mockResolvedValue(0);

            const { req, res } = createMockReqRes();
            await unreadCountController(req, res);

            expect(res.json).toHaveBeenCalledWith({ unreadCount: 0 });
        });

        it('returns 400 on error', async () => {
            getUnreadCount.mockRejectedValue(new Error('Database error'));

            const { req, res } = createMockReqRes();
            await unreadCountController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
        });
    });
});
