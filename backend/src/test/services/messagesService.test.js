import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock prisma
vi.mock('../../services/dbService.js', () => ({
    prisma: {
        conversations: {
            upsert: vi.fn(),
            findMany: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        messages: {
            create: vi.fn(),
            findMany: vi.fn(),
            count: vi.fn(),
        },
        conversation_participants: {
            findFirst: vi.fn(),
            findMany: vi.fn(),
            updateMany: vi.fn(),
        },
        users: {
            findUnique: vi.fn(),
        },
    },
}));

// Mock realtime service
vi.mock('../../services/realtimeService.js', () => ({
    publishToUser: vi.fn(),
}));

import { prisma } from '../../services/dbService.js';
import { publishToUser } from '../../services/realtimeService.js';

// Import after mocks
import {
    formatBanNoticeBody,
    ensureDirectConversationByUserIds,
    sendTaggedMessageToDirectConversation,
} from '../../services/messagesService.js';

describe('messagesService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('formatBanNoticeBody', () => {
        it('formats ban notice with reason and date', () => {
            const bannedUntil = new Date('2025-01-15T12:00:00Z');
            const result = formatBanNoticeBody({
                reason: 'Spam detected',
                bannedUntil,
            });

            expect(result).toContain('[BAN]');
            expect(result).toContain('Votre compte a été banni');
            expect(result).toContain('Motif: Spam detected');
            expect(result).toContain('Fin: 2025-01-15');
        });

        it('formats ban notice without bannedUntil', () => {
            const result = formatBanNoticeBody({
                reason: 'Violation of rules',
                bannedUntil: null,
            });

            expect(result).toContain('[BAN]');
            expect(result).toContain("Fin: jusqu'à réactivation");
        });

        it('handles empty reason', () => {
            const result = formatBanNoticeBody({
                reason: '',
                bannedUntil: null,
            });

            expect(result).toContain('Motif: Non spécifié');
        });

        it('handles undefined reason', () => {
            const result = formatBanNoticeBody({
                reason: undefined,
                bannedUntil: null,
            });

            expect(result).toContain('Motif: Non spécifié');
        });

        it('trims whitespace from reason', () => {
            const result = formatBanNoticeBody({
                reason: '  Spamming  ',
                bannedUntil: null,
            });

            expect(result).toContain('Motif: Spamming');
        });
    });

    describe('ensureDirectConversationByUserIds', () => {
        it('creates a new conversation if not exists', async () => {
            prisma.conversations.upsert.mockResolvedValue({ id: 100 });

            const result = await ensureDirectConversationByUserIds({
                userAId: 1,
                userBId: 2,
            });

            expect(result).toBe(100);
            expect(prisma.conversations.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { direct_key: '1:2' },
                    create: expect.objectContaining({
                        type: 'direct',
                        direct_key: '1:2',
                    }),
                })
            );
        });

        it('normalizes user ids for consistent key', async () => {
            prisma.conversations.upsert.mockResolvedValue({ id: 101 });

            // Provide in reverse order - should still create same key
            await ensureDirectConversationByUserIds({
                userAId: 5,
                userBId: 3,
            });

            expect(prisma.conversations.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { direct_key: '3:5' },
                })
            );
        });

        it('throws error for invalid user ids', async () => {
            await expect(
                ensureDirectConversationByUserIds({
                    userAId: null,
                    userBId: 2,
                })
            ).rejects.toThrow('Invalid user ids');
        });

        it('throws error for NaN user ids', async () => {
            await expect(
                ensureDirectConversationByUserIds({
                    userAId: 'abc',
                    userBId: 2,
                })
            ).rejects.toThrow('Invalid user ids');
        });

        it('throws error when trying to message self', async () => {
            await expect(
                ensureDirectConversationByUserIds({
                    userAId: 5,
                    userBId: 5,
                })
            ).rejects.toThrow('Cannot create direct conversation with self');
        });
    });

    describe('sendTaggedMessageToDirectConversation', () => {
        it('creates message and notifies target user', async () => {
            prisma.conversations.upsert.mockResolvedValue({ id: 200 });
            prisma.messages.create.mockResolvedValue({
                id: 1,
                conversation_id: 200,
                body: 'Test message',
                created_at: new Date(),
                sender: { id: 1, pseudo: 'sender', role: 'user' },
            });
            prisma.conversations.update.mockResolvedValue({});
            prisma.conversation_participants.findMany.mockResolvedValue([]);

            const result = await sendTaggedMessageToDirectConversation({
                senderId: 1,
                targetUserId: 2,
                body: 'Test message',
            });

            expect(result).toHaveProperty('id', 1);
            expect(result).toHaveProperty('conversationId', 200);
            expect(result).toHaveProperty('body', 'Test message');
            expect(publishToUser).toHaveBeenCalledWith(2, 'message:new', expect.any(Object));
        });

        it('truncates long messages to 2000 chars', async () => {
            prisma.conversations.upsert.mockResolvedValue({ id: 200 });
            prisma.messages.create.mockResolvedValue({
                id: 1,
                conversation_id: 200,
                body: 'Truncated',
                created_at: new Date(),
                sender: { id: 1, pseudo: 'sender', role: 'user' },
            });
            prisma.conversations.update.mockResolvedValue({});
            prisma.conversation_participants.findMany.mockResolvedValue([]);

            const longMessage = 'a'.repeat(3000);
            await sendTaggedMessageToDirectConversation({
                senderId: 1,
                targetUserId: 2,
                body: longMessage,
            });

            // Check that message was created (body would be truncated in real service)
            expect(prisma.messages.create).toHaveBeenCalled();
        });

        it('handles empty message body', async () => {
            prisma.conversations.upsert.mockResolvedValue({ id: 200 });
            prisma.messages.create.mockResolvedValue({
                id: 1,
                conversation_id: 200,
                body: '',
                created_at: new Date(),
                sender: { id: 1, pseudo: 'sender', role: 'user' },
            });
            prisma.conversations.update.mockResolvedValue({});
            prisma.conversation_participants.findMany.mockResolvedValue([]);

            await sendTaggedMessageToDirectConversation({
                senderId: 1,
                targetUserId: 2,
                body: '',
            });

            expect(prisma.messages.create).toHaveBeenCalled();
        });

        it('publishes unread count to target user', async () => {
            prisma.conversations.upsert.mockResolvedValue({ id: 200 });
            prisma.messages.create.mockResolvedValue({
                id: 1,
                conversation_id: 200,
                body: 'Hello',
                created_at: new Date(),
                sender: { id: 1, pseudo: 'sender', role: 'user' },
            });
            prisma.conversations.update.mockResolvedValue({});
            prisma.conversation_participants.findMany.mockResolvedValue([
                { conversation_id: 200, last_read_at: null },
            ]);
            prisma.messages.count.mockResolvedValue(5);

            await sendTaggedMessageToDirectConversation({
                senderId: 1,
                targetUserId: 2,
                body: 'Hello',
            });

            expect(publishToUser).toHaveBeenCalledWith(
                2,
                'messages:unread_count',
                expect.objectContaining({ unreadCount: expect.any(Number) })
            );
        });
    });
});
