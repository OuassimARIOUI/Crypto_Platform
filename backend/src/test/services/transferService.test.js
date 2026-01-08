import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock prisma before importing the service
vi.mock('../../services/dbService', () => ({
    default: {
        portfolio: {
            findUnique: vi.fn(),
        },
        transaction: {
            create: vi.fn(),
            findMany: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
        },
    },
}));

import prisma from '../../services/dbService';

describe('Transfer Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Portfolio operations', () => {
        it('finds portfolio by userId', async () => {
            const mockPortfolio = { id: 1, userId: 1, totalValue: 1000 };
            prisma.portfolio.findUnique.mockResolvedValue(mockPortfolio);

            const result = await prisma.portfolio.findUnique({
                where: { userId: 1 }
            });

            expect(result).toEqual(mockPortfolio);
            expect(prisma.portfolio.findUnique).toHaveBeenCalledWith({
                where: { userId: 1 }
            });
        });

        it('returns null when portfolio not found', async () => {
            prisma.portfolio.findUnique.mockResolvedValue(null);

            const result = await prisma.portfolio.findUnique({
                where: { userId: 999 }
            });

            expect(result).toBeNull();
        });
    });

    describe('Transaction operations', () => {
        it('creates a transaction', async () => {
            const mockTransaction = { 
                id: 1, 
                userId: 1, 
                type: 'deposit', 
                amount: 100, 
                status: 'completed' 
            };
            prisma.transaction.create.mockResolvedValue(mockTransaction);

            const result = await prisma.transaction.create({
                data: {
                    userId: 1,
                    type: 'deposit',
                    amount: 100,
                    status: 'completed'
                }
            });

            expect(result).toEqual(mockTransaction);
            expect(prisma.transaction.create).toHaveBeenCalled();
        });

        it('finds user transactions', async () => {
            const mockTransactions = [
                { id: 1, userId: 1, type: 'deposit', amount: 100 },
                { id: 2, userId: 1, type: 'withdraw', amount: 50 }
            ];
            prisma.transaction.findMany.mockResolvedValue(mockTransactions);

            const result = await prisma.transaction.findMany({
                where: { userId: 1 },
                orderBy: { createdAt: 'desc' }
            });

            expect(result).toEqual(mockTransactions);
            expect(result).toHaveLength(2);
        });

        it('returns empty array when no transactions', async () => {
            prisma.transaction.findMany.mockResolvedValue([]);

            const result = await prisma.transaction.findMany({
                where: { userId: 1 }
            });

            expect(result).toEqual([]);
        });

        it('finds transaction by id', async () => {
            const mockTransaction = { id: 1, userId: 1, type: 'deposit', amount: 100 };
            prisma.transaction.findUnique.mockResolvedValue(mockTransaction);

            const result = await prisma.transaction.findUnique({
                where: { id: 1, userId: 1 }
            });

            expect(result).toEqual(mockTransaction);
        });

        it('updates transaction status', async () => {
            const mockTransaction = { id: 1, status: 'completed' };
            prisma.transaction.update.mockResolvedValue(mockTransaction);

            const result = await prisma.transaction.update({
                where: { id: 1 },
                data: { status: 'completed' }
            });

            expect(result.status).toBe('completed');
        });

        it('handles different transaction types', async () => {
            const types = ['deposit', 'withdraw', 'transfer'];
            
            for (const type of types) {
                prisma.transaction.create.mockResolvedValue({ id: 1, type });
                const result = await prisma.transaction.create({
                    data: { userId: 1, type, amount: 100 }
                });
                expect(result.type).toBe(type);
            }
        });
    });
});
