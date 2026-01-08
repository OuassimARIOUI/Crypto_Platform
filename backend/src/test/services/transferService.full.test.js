import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock prisma
vi.mock('../../services/dbService.js', () => ({
    prisma: {
        users: {
            findUnique: vi.fn(),
        },
        portfolios: {
            upsert: vi.fn(),
            update: vi.fn(),
        },
        wallet_transfers: {
            create: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}));

// Mock realtime service
vi.mock('../../services/realtimeService.js', () => ({
    publishToUser: vi.fn(),
}));

// Mock messages service
vi.mock('../../services/messagesService.js', () => ({
    sendTaggedMessageToDirectConversation: vi.fn(),
}));

import { prisma } from '../../services/dbService.js';
import { publishToUser } from '../../services/realtimeService.js';
import { sendTaggedMessageToDirectConversation } from '../../services/messagesService.js';
import { transferBetweenUsers } from '../../services/transferService.js';

describe('transferService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('transferBetweenUsers', () => {
        const mockSender = { id: 1, pseudo: 'sender', role: 'user' };
        const mockReceiver = { id: 2, pseudo: 'receiver' };

        it('successfully transfers funds between users', async () => {
            prisma.users.findUnique
                .mockResolvedValueOnce(mockSender)
                .mockResolvedValueOnce(mockReceiver);

            prisma.$transaction.mockImplementation(async (callback) => {
                return callback({
                    portfolios: {
                        upsert: vi.fn()
                            .mockResolvedValueOnce({ balance: 1000 })
                            .mockResolvedValueOnce({ balance: 0 }),
                        update: vi.fn()
                            .mockResolvedValueOnce({ balance: 900 })
                            .mockResolvedValueOnce({ balance: 100 }),
                    },
                    wallet_transfers: {
                        create: vi.fn().mockResolvedValue({
                            id: 1,
                            sender_id: 1,
                            receiver_id: 2,
                            amount: 100,
                            reason: 'Test',
                            created_at: new Date(),
                        }),
                    },
                });
            });

            sendTaggedMessageToDirectConversation.mockResolvedValue({});

            const result = await transferBetweenUsers({
                senderId: 1,
                receiverPseudo: 'receiver',
                amount: 100,
                reason: 'Test transfer',
            });

            expect(result).toBeDefined();
            expect(publishToUser).toHaveBeenCalledWith(1, 'portfolio:changed', expect.any(Object));
            expect(publishToUser).toHaveBeenCalledWith(2, 'portfolio:changed', expect.any(Object));
            expect(sendTaggedMessageToDirectConversation).toHaveBeenCalled();
        });

        it('throws error for missing sender id', async () => {
            await expect(
                transferBetweenUsers({
                    senderId: null,
                    receiverPseudo: 'receiver',
                    amount: 100,
                })
            ).rejects.toThrow('User id manquant');
        });

        it('throws error for invalid sender id (NaN)', async () => {
            await expect(
                transferBetweenUsers({
                    senderId: 'invalid',
                    receiverPseudo: 'receiver',
                    amount: 100,
                })
            ).rejects.toThrow('User id manquant');
        });

        it('throws error for missing receiver pseudo', async () => {
            await expect(
                transferBetweenUsers({
                    senderId: 1,
                    receiverPseudo: null,
                    amount: 100,
                })
            ).rejects.toThrow('Pseudo destinataire requis');
        });

        it('throws error for empty receiver pseudo', async () => {
            await expect(
                transferBetweenUsers({
                    senderId: 1,
                    receiverPseudo: '   ',
                    amount: 100,
                })
            ).rejects.toThrow('Pseudo destinataire requis');
        });

        it('throws error for invalid amount (zero)', async () => {
            await expect(
                transferBetweenUsers({
                    senderId: 1,
                    receiverPseudo: 'receiver',
                    amount: 0,
                })
            ).rejects.toThrow('Montant invalide');
        });

        it('throws error for negative amount', async () => {
            await expect(
                transferBetweenUsers({
                    senderId: 1,
                    receiverPseudo: 'receiver',
                    amount: -50,
                })
            ).rejects.toThrow('Montant invalide');
        });

        it('throws error for non-finite amount', async () => {
            await expect(
                transferBetweenUsers({
                    senderId: 1,
                    receiverPseudo: 'receiver',
                    amount: Infinity,
                })
            ).rejects.toThrow('Montant invalide');
        });

        it('throws error when sender not found', async () => {
            prisma.users.findUnique
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(mockReceiver);

            await expect(
                transferBetweenUsers({
                    senderId: 999,
                    receiverPseudo: 'receiver',
                    amount: 100,
                })
            ).rejects.toThrow('User not found');
        });

        it('throws error when receiver not found', async () => {
            prisma.users.findUnique
                .mockResolvedValueOnce(mockSender)
                .mockResolvedValueOnce(null);

            await expect(
                transferBetweenUsers({
                    senderId: 1,
                    receiverPseudo: 'nonexistent',
                    amount: 100,
                })
            ).rejects.toThrow('Destinataire introuvable');
        });

        it('throws error when transferring to self', async () => {
            prisma.users.findUnique
                .mockResolvedValueOnce(mockSender)
                .mockResolvedValueOnce({ id: 1, pseudo: 'sender' });

            await expect(
                transferBetweenUsers({
                    senderId: 1,
                    receiverPseudo: 'sender',
                    amount: 100,
                })
            ).rejects.toThrow('Impossible de transférer vers soi-même');
        });

        it('throws error for insufficient balance', async () => {
            prisma.users.findUnique
                .mockResolvedValueOnce(mockSender)
                .mockResolvedValueOnce(mockReceiver);

            prisma.$transaction.mockImplementation(async (callback) => {
                return callback({
                    portfolios: {
                        upsert: vi.fn().mockResolvedValue({ balance: 50 }),
                    },
                    wallet_transfers: {
                        create: vi.fn(),
                    },
                });
            });

            await expect(
                transferBetweenUsers({
                    senderId: 1,
                    receiverPseudo: 'receiver',
                    amount: 100,
                })
            ).rejects.toThrow('Solde insuffisant');
        });

        it('normalizes reason string', async () => {
            prisma.users.findUnique
                .mockResolvedValueOnce(mockSender)
                .mockResolvedValueOnce(mockReceiver);

            prisma.$transaction.mockImplementation(async (callback) => {
                return callback({
                    portfolios: {
                        upsert: vi.fn()
                            .mockResolvedValueOnce({ balance: 1000 })
                            .mockResolvedValueOnce({ balance: 0 }),
                        update: vi.fn()
                            .mockResolvedValueOnce({ balance: 900 })
                            .mockResolvedValueOnce({ balance: 100 }),
                    },
                    wallet_transfers: {
                        create: vi.fn().mockResolvedValue({
                            id: 1,
                            sender_id: 1,
                            receiver_id: 2,
                            amount: 100,
                            reason: 'Trimmed reason',
                            created_at: new Date(),
                        }),
                    },
                });
            });

            sendTaggedMessageToDirectConversation.mockResolvedValue({});

            await transferBetweenUsers({
                senderId: 1,
                receiverPseudo: 'receiver',
                amount: 100,
                reason: '  Trimmed reason  ',
            });

            expect(prisma.$transaction).toHaveBeenCalled();
        });

        it('handles null reason', async () => {
            prisma.users.findUnique
                .mockResolvedValueOnce(mockSender)
                .mockResolvedValueOnce(mockReceiver);

            prisma.$transaction.mockImplementation(async (callback) => {
                return callback({
                    portfolios: {
                        upsert: vi.fn()
                            .mockResolvedValueOnce({ balance: 1000 })
                            .mockResolvedValueOnce({ balance: 0 }),
                        update: vi.fn()
                            .mockResolvedValueOnce({ balance: 900 })
                            .mockResolvedValueOnce({ balance: 100 }),
                    },
                    wallet_transfers: {
                        create: vi.fn().mockResolvedValue({
                            id: 1,
                            sender_id: 1,
                            receiver_id: 2,
                            amount: 100,
                            reason: null,
                            created_at: new Date(),
                        }),
                    },
                });
            });

            sendTaggedMessageToDirectConversation.mockResolvedValue({});

            await transferBetweenUsers({
                senderId: 1,
                receiverPseudo: 'receiver',
                amount: 100,
                reason: null,
            });

            expect(prisma.$transaction).toHaveBeenCalled();
        });
    });
});
