import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock prisma
vi.mock('../../services/dbService.js', () => ({
    prisma: {
        crypto_prices: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
        },
        cryptos: {
            findUnique: vi.fn(),
        },
        indicators_history: {
            create: vi.fn(),
        },
    },
}));

import { prisma } from '../../services/dbService.js';
import {
    calculateSMA,
    getVariation24h,
    computeIndicatorsForCrypto,
    getIndicatorsBySymbol,
} from '../../services/indicatorService.js';

describe('indicatorService - Full Coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    describe('calculateSMA', () => {
        it('calculates SMA correctly', async () => {
            const mockPrices = [
                { price_usd: 100 },
                { price_usd: 110 },
                { price_usd: 120 },
                { price_usd: 130 },
                { price_usd: 140 },
            ];
            prisma.crypto_prices.findMany.mockResolvedValue(mockPrices);

            const result = await calculateSMA(1, 5);

            expect(result).toBe(120); // (100+110+120+130+140) / 5
        });

        it('returns null when not enough data', async () => {
            const mockPrices = [
                { price_usd: 100 },
                { price_usd: 110 },
            ];
            prisma.crypto_prices.findMany.mockResolvedValue(mockPrices);

            const result = await calculateSMA(1, 5);

            expect(result).toBeNull();
        });

        it('returns null when no data', async () => {
            prisma.crypto_prices.findMany.mockResolvedValue([]);

            const result = await calculateSMA(1, 7);

            expect(result).toBeNull();
        });

        it('handles decimal prices correctly', async () => {
            const mockPrices = [
                { price_usd: 0.00001234 },
                { price_usd: 0.00001345 },
                { price_usd: 0.00001456 },
            ];
            prisma.crypto_prices.findMany.mockResolvedValue(mockPrices);

            const result = await calculateSMA(1, 3);

            expect(result).toBeCloseTo(0.00001345, 10);
        });

        it('handles string prices (converts to number)', async () => {
            const mockPrices = [
                { price_usd: '100.50' },
                { price_usd: '101.50' },
                { price_usd: '102.00' },
            ];
            prisma.crypto_prices.findMany.mockResolvedValue(mockPrices);

            const result = await calculateSMA(1, 3);

            expect(result).toBeCloseTo(101.33, 2);
        });
    });

    describe('getVariation24h', () => {
        it('returns variation when data exists', async () => {
            prisma.crypto_prices.findFirst.mockResolvedValue({
                price_usd: 50000,
                change_percent_24h: 5.5,
            });

            const result = await getVariation24h(1);

            expect(result).toBe(5.5);
        });

        it('returns null when no data', async () => {
            prisma.crypto_prices.findFirst.mockResolvedValue(null);

            const result = await getVariation24h(1);

            expect(result).toBeNull();
        });

        it('returns null when change_percent_24h is null', async () => {
            prisma.crypto_prices.findFirst.mockResolvedValue({
                price_usd: 50000,
                change_percent_24h: null,
            });

            const result = await getVariation24h(1);

            expect(result).toBeNull();
        });

        it('handles negative variation', async () => {
            prisma.crypto_prices.findFirst.mockResolvedValue({
                price_usd: 45000,
                change_percent_24h: -8.3,
            });

            const result = await getVariation24h(1);

            expect(result).toBe(-8.3);
        });
    });

    describe('computeIndicatorsForCrypto', () => {
        it('computes and saves indicators', async () => {
            // Mock SMA calculations
            prisma.crypto_prices.findMany
                .mockResolvedValueOnce([
                    { price_usd: 100 }, { price_usd: 100 }, { price_usd: 100 },
                    { price_usd: 100 }, { price_usd: 100 }, { price_usd: 100 },
                    { price_usd: 100 },
                ]) // SMA7
                .mockResolvedValueOnce([
                    ...Array(30).fill({ price_usd: 200 }),
                ]); // SMA30

            prisma.crypto_prices.findFirst.mockResolvedValue({
                change_percent_24h: 3.5,
            });

            prisma.indicators_history.create.mockResolvedValue({});

            await computeIndicatorsForCrypto(1);

            expect(prisma.indicators_history.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    crypto_id: 1,
                    sma7: expect.any(Number),
                    sma30: expect.any(Number),
                    variation_24h: 3.5,
                    fetched_at: expect.any(Date),
                }),
            });
        });

        it('handles string cryptoId', async () => {
            prisma.crypto_prices.findMany.mockResolvedValue([]);
            prisma.crypto_prices.findFirst.mockResolvedValue(null);
            prisma.indicators_history.create.mockResolvedValue({});

            await computeIndicatorsForCrypto('1');

            expect(prisma.indicators_history.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    crypto_id: 1,
                }),
            });
        });

        it('saves null values when no data available', async () => {
            prisma.crypto_prices.findMany.mockResolvedValue([]);
            prisma.crypto_prices.findFirst.mockResolvedValue(null);
            prisma.indicators_history.create.mockResolvedValue({});

            await computeIndicatorsForCrypto(1);

            expect(prisma.indicators_history.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    sma7: null,
                    sma30: null,
                    variation_24h: null,
                }),
            });
        });
    });

    describe('getIndicatorsBySymbol', () => {
        it('returns indicators for valid symbol', async () => {
            prisma.cryptos.findUnique.mockResolvedValue({ id: 1, symbol: 'btc' });
            prisma.crypto_prices.findMany.mockResolvedValue([
                { price_usd: 50000, fetched_at: new Date('2025-01-01') },
                { price_usd: 51000, fetched_at: new Date('2025-01-02') },
                { price_usd: 52000, fetched_at: new Date('2025-01-03') },
                { price_usd: 53000, fetched_at: new Date('2025-01-04') },
                { price_usd: 54000, fetched_at: new Date('2025-01-05') },
                { price_usd: 55000, fetched_at: new Date('2025-01-06') },
                { price_usd: 56000, fetched_at: new Date('2025-01-07') },
                { price_usd: 57000, fetched_at: new Date('2025-01-08') },
            ]);
            prisma.crypto_prices.findFirst.mockResolvedValue({ change_percent_24h: 2.5 });

            const result = await getIndicatorsBySymbol('btc');

            expect(result).toHaveProperty('symbol', 'btc');
            expect(result).toHaveProperty('prices');
            expect(result).toHaveProperty('times');
            expect(result).toHaveProperty('sma7Series');
            expect(result).toHaveProperty('sma30Series');
        });

        it('returns null for unknown symbol', async () => {
            prisma.cryptos.findUnique.mockResolvedValue(null);

            const result = await getIndicatorsBySymbol('UNKNOWN');

            expect(result).toBeNull();
        });

        it('includes price and time series in result', async () => {
            prisma.cryptos.findUnique.mockResolvedValue({ id: 1, symbol: 'eth' });
            const mockHistory = [
                { price_usd: 3000, fetched_at: new Date('2025-01-01T10:00:00Z') },
                { price_usd: 3100, fetched_at: new Date('2025-01-01T11:00:00Z') },
                { price_usd: 3200, fetched_at: new Date('2025-01-01T12:00:00Z') },
            ];
            prisma.crypto_prices.findMany.mockResolvedValue(mockHistory);
            prisma.crypto_prices.findFirst.mockResolvedValue({ change_percent_24h: 1.5 });

            const result = await getIndicatorsBySymbol('eth');

            // Prices should be reversed (oldest first)
            expect(result.prices).toEqual([3200, 3100, 3000]);
            expect(result.times.length).toBe(3);
        });

        it('calculates SMA series correctly', async () => {
            prisma.cryptos.findUnique.mockResolvedValue({ id: 1, symbol: 'btc' });
            
            // Create array with enough data points for SMA7
            const mockHistory = Array(10).fill(null).map((_, i) => ({
                price_usd: 1000 + i * 100,
                fetched_at: new Date(`2025-01-0${i + 1}`),
            }));
            prisma.crypto_prices.findMany.mockResolvedValue(mockHistory);
            prisma.crypto_prices.findFirst.mockResolvedValue({ change_percent_24h: 0 });

            const result = await getIndicatorsBySymbol('btc');

            // First 6 elements of sma7Series should be null (not enough data)
            expect(result.sma7Series.slice(0, 7).filter(x => x === null).length).toBe(7);
        });
    });
});
