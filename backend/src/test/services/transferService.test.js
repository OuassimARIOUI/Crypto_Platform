const { describe, it, expect, beforeEach, afterEach, vi } = require('@jest/globals');
const transferService = require('../../services/transferService');
const prisma = require('../../services/dbService');

vi.mock('../../services/dbService');

describe('Transfer Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createTransfer', () => {
    it('creates a transfer successfully with sufficient balance', async () => {
      const mockPortfolio = { totalValue: 1000 };
      const mockTransaction = { 
        id: 1, 
        userId: 1, 
        type: 'withdraw', 
        amount: 100, 
        status: 'completed' 
      };

      prisma.portfolio.findUnique = vi.fn().mockResolvedValue(mockPortfolio);
      prisma.transaction.create = vi.fn().mockResolvedValue(mockTransaction);

      const result = await transferService.createTransfer(1, 'withdraw', 100, 'Test transfer');

      expect(result).toEqual(mockTransaction);
      expect(prisma.portfolio.findUnique).toHaveBeenCalledWith({
        where: { userId: 1 }
      });
      expect(prisma.transaction.create).toHaveBeenCalled();
    });

    it('throws error when insufficient balance', async () => {
      const mockPortfolio = { totalValue: 50 };

      prisma.portfolio.findUnique = vi.fn().mockResolvedValue(mockPortfolio);

      await expect(
        transferService.createTransfer(1, 'withdraw', 100, 'Test')
      ).rejects.toThrow('Solde insuffisant');
    });

    it('throws error when portfolio not found', async () => {
      prisma.portfolio.findUnique = vi.fn().mockResolvedValue(null);

      await expect(
        transferService.createTransfer(1, 'withdraw', 100, 'Test')
      ).rejects.toThrow('Portfolio non trouvé');
    });

    it('creates deposit transfer without balance check', async () => {
      const mockPortfolio = { totalValue: 100 };
      const mockTransaction = { 
        id: 2, 
        userId: 1, 
        type: 'deposit', 
        amount: 500 
      };

      prisma.portfolio.findUnique = vi.fn().mockResolvedValue(mockPortfolio);
      prisma.transaction.create = vi.fn().mockResolvedValue(mockTransaction);

      const result = await transferService.createTransfer(1, 'deposit', 500, 'Deposit');

      expect(result).toEqual(mockTransaction);
      expect(prisma.transaction.create).toHaveBeenCalled();
    });
  });

  describe('getUserTransfers', () => {
    it('returns user transfers', async () => {
      const mockTransfers = [
        { id: 1, userId: 1, type: 'deposit', amount: 100 },
        { id: 2, userId: 1, type: 'withdraw', amount: 50 }
      ];

      prisma.transaction.findMany = vi.fn().mockResolvedValue(mockTransfers);

      const result = await transferService.getUserTransfers(1);

      expect(result).toEqual(mockTransfers);
      expect(prisma.transaction.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        orderBy: { createdAt: 'desc' }
      });
    });

    it('returns empty array when no transfers', async () => {
      prisma.transaction.findMany = vi.fn().mockResolvedValue([]);

      const result = await transferService.getUserTransfers(1);

      expect(result).toEqual([]);
    });
  });

  describe('getTransferById', () => {
    it('returns transfer by id', async () => {
      const mockTransfer = { id: 1, userId: 1, type: 'deposit', amount: 100 };

      prisma.transaction.findUnique = vi.fn().mockResolvedValue(mockTransfer);

      const result = await transferService.getTransferById(1, 1);

      expect(result).toEqual(mockTransfer);
      expect(prisma.transaction.findUnique).toHaveBeenCalledWith({
        where: { id: 1, userId: 1 }
      });
    });

    it('returns null when transfer not found', async () => {
      prisma.transaction.findUnique = vi.fn().mockResolvedValue(null);

      const result = await transferService.getTransferById(999, 1);

      expect(result).toBeNull();
    });
  });

  describe('updateTransferStatus', () => {
    it('updates transfer status successfully', async () => {
      const mockTransfer = { 
        id: 1, 
        userId: 1, 
        status: 'completed' 
      };

      prisma.transaction.update = vi.fn().mockResolvedValue(mockTransfer);

      const result = await transferService.updateTransferStatus(1, 'completed');

      expect(result).toEqual(mockTransfer);
      expect(prisma.transaction.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'completed' }
      });
    });

    it('handles different status values', async () => {
      const statuses = ['pending', 'completed', 'failed', 'cancelled'];

      for (const status of statuses) {
        prisma.transaction.update = vi.fn().mockResolvedValue({ id: 1, status });
        const result = await transferService.updateTransferStatus(1, status);
        expect(result.status).toBe(status);
      }
    });
  });
});
