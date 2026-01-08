import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies
vi.mock('../../services/dbService.js', () => ({
    prisma: {
        users: {
            findUnique: vi.fn(),
        },
        conversations: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            upsert: vi.fn(),
            update: vi.fn(),
        },
        conversation_participants: {
            findFirst: vi.fn(),
            findMany: vi.fn(),
            updateMany: vi.fn(),
        },
        messages: {
            findMany: vi.fn(),
            create: vi.fn(),
            count: vi.fn(),
        },
    },
}));

vi.mock('../../services/realtimeService.js', () => ({
    publishToUser: vi.fn(),
}));

import { prisma } from '../../services/dbService.js';
import { publishToUser } from '../../services/realtimeService.js';
import {
    listMyConversations,
    startDirectConversationByPseudo,
    getConversationMessages,
    getUnreadCount,
    sendMessageToConversation,
} from '../../services/messagesService.js';

describe('messagesService - Full Coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('listMyConversations', () => {
        it('returns user conversations with last message', async () => {
            prisma.conversations.findMany.mockResolvedValue([
                {
                    id: 1,
                    type: 'direct',
                    updated_at: new Date(),
                    created_at: new Date(),
                    participants: [
                        { user: { id: 1, pseudo: 'user1', role: 'user' } },
                        { user: { id: 2, pseudo: 'user2', role: 'user' } },
                    ],
                    messages: [
                        { id: 10, body: 'Hello', created_at: new Date(), sender_id: 1 },
                    ],
                },
            ]);

            const result = await listMyConversations(1);

            expect(result).toHaveLength(1);
            expect(result[0].lastMessage).toBeTruthy();
            expect(result[0].lastMessage.body).toBe('Hello');
        });

        it('returns null for lastMessage when no messages', async () => {
            prisma.conversations.findMany.mockResolvedValue([
                {
                    id: 1,
                    type: 'direct',
                    updated_at: new Date(),
                    created_at: new Date(),
                    participants: [],
                    messages: [],
                },
            ]);

            const result = await listMyConversations(1);

            expect(result[0].lastMessage).toBeNull();
        });
    });

    describe('startDirectConversationByPseudo', () => {
        it('creates new conversation', async () => {
            prisma.users.findUnique.mockResolvedValue({ id: 2, pseudo: 'target', role: 'user' });
            prisma.conversations.upsert.mockResolvedValue({
                id: 1,
                participants: [
                    { user: { id: 1, pseudo: 'me', role: 'user' } },
                    { user: { id: 2, pseudo: 'target', role: 'user' } },
                ],
            });

            const result = await startDirectConversationByPseudo({
                me: { id: 1, role: 'user' },
                targetPseudo: 'target',
            });

            expect(result.id).toBe(1);
            expect(result.participants).toHaveLength(2);
        });

        it('throws when pseudo is empty', async () => {
            await expect(
                startDirectConversationByPseudo({ me: { id: 1 }, targetPseudo: '' })
            ).rejects.toThrow('pseudo is required');
        });

        it('throws when user not found', async () => {
            prisma.users.findUnique.mockResolvedValue(null);

            await expect(
                startDirectConversationByPseudo({ me: { id: 1 }, targetPseudo: 'unknown' })
            ).rejects.toThrow('User not found');
        });

        it('throws when messaging yourself', async () => {
            prisma.users.findUnique.mockResolvedValue({ id: 1, pseudo: 'me', role: 'user' });

            await expect(
                startDirectConversationByPseudo({ me: { id: 1 }, targetPseudo: 'me' })
            ).rejects.toThrow('Cannot message yourself');
        });

        it('moderator cannot message regular users', async () => {
            prisma.users.findUnique.mockResolvedValue({ id: 2, pseudo: 'regular', role: 'user' });

            await expect(
                startDirectConversationByPseudo({
                    me: { id: 1, role: 'moderator' },
                    targetPseudo: 'regular',
                })
            ).rejects.toThrow('Moderators can only message admins/moderators');
        });

        it('moderator can message other moderators', async () => {
            prisma.users.findUnique.mockResolvedValue({ id: 2, pseudo: 'mod2', role: 'moderator' });
            prisma.conversations.upsert.mockResolvedValue({
                id: 1,
                participants: [
                    { user: { id: 1, pseudo: 'mod1', role: 'moderator' } },
                    { user: { id: 2, pseudo: 'mod2', role: 'moderator' } },
                ],
            });

            const result = await startDirectConversationByPseudo({
                me: { id: 1, role: 'moderator' },
                targetPseudo: 'mod2',
            });

            expect(result.id).toBe(1);
        });
    });

    describe('getConversationMessages', () => {
        it('returns messages when participant', async () => {
            prisma.conversation_participants.findFirst.mockResolvedValue({ id: 1 });
            prisma.conversation_participants.updateMany.mockResolvedValue({});
            prisma.messages.findMany.mockResolvedValue([
                { id: 1, conversation_id: 1, body: 'Hi', created_at: new Date(), sender: { id: 2, pseudo: 'user2', role: 'user' } },
            ]);

            const result = await getConversationMessages({ userId: 1, conversationId: 1 });

            expect(result).toHaveLength(1);
            expect(result[0].body).toBe('Hi');
        });

        it('throws for invalid conversation id', async () => {
            await expect(
                getConversationMessages({ userId: 1, conversationId: 'abc' })
            ).rejects.toThrow('Invalid conversation id');
        });

        it('throws when not a participant', async () => {
            prisma.conversation_participants.findFirst.mockResolvedValue(null);

            await expect(
                getConversationMessages({ userId: 1, conversationId: 1 })
            ).rejects.toThrow('Access denied');
        });

        it('handles custom limit', async () => {
            prisma.conversation_participants.findFirst.mockResolvedValue({ id: 1 });
            prisma.conversation_participants.updateMany.mockResolvedValue({});
            prisma.messages.findMany.mockResolvedValue([]);

            await getConversationMessages({ userId: 1, conversationId: 1, limit: 100 });

            expect(prisma.messages.findMany).toHaveBeenCalledWith(expect.objectContaining({
                take: 100,
            }));
        });
    });

    describe('getUnreadCount', () => {
        it('returns total unread count', async () => {
            prisma.conversation_participants.findMany.mockResolvedValue([
                { conversation_id: 1, last_read_at: new Date('2025-01-01') },
                { conversation_id: 2, last_read_at: null },
            ]);
            prisma.messages.count
                .mockResolvedValueOnce(3)
                .mockResolvedValueOnce(5);

            const result = await getUnreadCount(1);

            expect(result).toBe(8);
        });

        it('throws for invalid user id', async () => {
            await expect(getUnreadCount('abc')).rejects.toThrow('Invalid user id');
        });
    });

    describe('sendMessageToConversation', () => {
        it('sends message successfully', async () => {
            prisma.conversations.findUnique.mockResolvedValue({
                id: 1,
                participants: [
                    { user: { id: 1, role: 'user' } },
                    { user: { id: 2, role: 'user' } },
                ],
            });
            prisma.messages.create.mockResolvedValue({
                id: 100,
                conversation_id: 1,
                body: 'Test message',
                created_at: new Date(),
                sender: { id: 1, pseudo: 'user1', role: 'user' },
            });
            prisma.conversations.update.mockResolvedValue({});
            prisma.conversation_participants.findMany.mockResolvedValue([]);
            prisma.messages.count.mockResolvedValue(0);

            const result = await sendMessageToConversation({
                me: { id: 1, role: 'user' },
                conversationId: 1,
                body: 'Test message',
            });

            expect(result.body).toBe('Test message');
            expect(publishToUser).toHaveBeenCalled();
        });

        it('throws for invalid conversation id', async () => {
            await expect(
                sendMessageToConversation({ me: { id: 1 }, conversationId: 'x', body: 'hi' })
            ).rejects.toThrow('Invalid conversation id');
        });

        it('throws for empty message', async () => {
            await expect(
                sendMessageToConversation({ me: { id: 1 }, conversationId: 1, body: '   ' })
            ).rejects.toThrow('Message is empty');
        });

        it('throws when conversation not found', async () => {
            prisma.conversations.findUnique.mockResolvedValue(null);

            await expect(
                sendMessageToConversation({ me: { id: 1 }, conversationId: 1, body: 'hi' })
            ).rejects.toThrow('Conversation not found');
        });

        it('throws when not a participant', async () => {
            prisma.conversations.findUnique.mockResolvedValue({
                id: 1,
                participants: [
                    { user: { id: 2, role: 'user' } },
                    { user: { id: 3, role: 'user' } },
                ],
            });

            await expect(
                sendMessageToConversation({ me: { id: 1 }, conversationId: 1, body: 'hi' })
            ).rejects.toThrow('Access denied');
        });

        it('moderator cannot message regular users', async () => {
            prisma.conversations.findUnique.mockResolvedValue({
                id: 1,
                participants: [
                    { user: { id: 1, role: 'moderator' } },
                    { user: { id: 2, role: 'user' } },
                ],
            });

            await expect(
                sendMessageToConversation({
                    me: { id: 1, role: 'moderator' },
                    conversationId: 1,
                    body: 'hi',
                })
            ).rejects.toThrow('Moderators can only message admins/moderators');
        });

        it('notifies all other participants', async () => {
            prisma.conversations.findUnique.mockResolvedValue({
                id: 1,
                participants: [
                    { user: { id: 1, role: 'admin' } },
                    { user: { id: 2, role: 'admin' } },
                    { user: { id: 3, role: 'admin' } },
                ],
            });
            prisma.messages.create.mockResolvedValue({
                id: 1, conversation_id: 1, body: 'hi', created_at: new Date(),
                sender: { id: 1, pseudo: 'admin1', role: 'admin' },
            });
            prisma.conversations.update.mockResolvedValue({});
            prisma.conversation_participants.findMany.mockResolvedValue([]);
            prisma.messages.count.mockResolvedValue(0);

            await sendMessageToConversation({
                me: { id: 1, role: 'admin' },
                conversationId: 1,
                body: 'hello all',
            });

            // Should notify users 2 and 3
            expect(publishToUser).toHaveBeenCalledTimes(4); // 2 users × 2 events each
        });
    });
});
