import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock prisma
vi.mock('../../services/dbService.js', () => ({
    prisma: {
        cryptos: {
            findUnique: vi.fn(),
            create: vi.fn(),
        },
        crypto_prices: {
            create: vi.fn(),
        },
    },
}));

// Mock fetch service
vi.mock('../../services/fetchService.js', () => ({
    fetchCryptoData: vi.fn(),
}));

// Mock logger
vi.mock('../../utils/logger.js', () => ({
    logInfo: vi.fn(),
    logError: vi.fn(),
}));

import { prisma } from '../../services/dbService.js';
import { fetchCryptoData } from '../../services/fetchService.js';
import { logInfo, logError } from '../../utils/logger.js';
import { insertCryptoData } from '../../services/insertCryptoService.js';

describe('insertCryptoService - Full Coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    describe('insertCryptoData', () => {
        it('inserts new crypto and price data', async () => {
            const mockData = [
                {
                    symbol: 'btc',
                    name: 'Bitcoin',
                    current_price: 50000,
                    total_volume: 1000000000,
                    market_cap: 900000000000,
                    price_change_percentage_24h: 2.5,
                    high_24h: 51000,
                    low_24h: 49000,
                    circulating_supply: 19000000,
                    total_supply: 21000000,
                    ath: 69000,
                    ath_change_percentage: -27.5,
                    atl: 67,
                    atl_change_percentage: 74527,
                },
            ];

            fetchCryptoData.mockResolvedValue(mockData);
            prisma.cryptos.findUnique.mockResolvedValue(null); // New crypto
            prisma.cryptos.create.mockResolvedValue({ id: 1, symbol: 'btc' });
            prisma.crypto_prices.create.mockResolvedValue({});

            await insertCryptoData();

            expect(prisma.cryptos.create).toHaveBeenCalledWith({
                data: {
                    symbol: 'btc',
                    name: 'btc',
                    created_at: expect.any(Date),
                },
            });
            expect(prisma.crypto_prices.create).toHaveBeenCalled();
            expect(logInfo).toHaveBeenCalledWith(' Insertion terminée !');
        });

        it('updates price for existing crypto', async () => {
            const mockData = [
                {
                    symbol: 'eth',
                    name: 'Ethereum',
                    current_price: 3500,
                    total_volume: 500000000,
                    market_cap: 400000000000,
                    price_change_percentage_24h: -1.2,
                    high_24h: 3600,
                    low_24h: 3400,
                    circulating_supply: 120000000,
                    total_supply: null,
                    ath: 4800,
                    ath_change_percentage: -27,
                    atl: 0.42,
                    atl_change_percentage: 833233,
                },
            ];

            fetchCryptoData.mockResolvedValue(mockData);
            prisma.cryptos.findUnique.mockResolvedValue({ id: 2, symbol: 'eth' }); // Existing crypto
            prisma.crypto_prices.create.mockResolvedValue({});

            await insertCryptoData();

            // Should NOT create new crypto
            expect(prisma.cryptos.create).not.toHaveBeenCalled();
            // Should create price entry
            expect(prisma.crypto_prices.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    crypto_id: 2,
                    price_usd: 3500,
                }),
            });
        });

        it('handles empty data from API', async () => {
            fetchCryptoData.mockResolvedValue([]);

            await insertCryptoData();

            expect(logError).toHaveBeenCalledWith(expect.stringContaining("API"));
            expect(prisma.cryptos.findUnique).not.toHaveBeenCalled();
        });

        it('handles null data from API', async () => {
            fetchCryptoData.mockResolvedValue(null);

            await insertCryptoData();

            expect(logError).toHaveBeenCalledWith(expect.stringContaining("API"));
        });

        it('handles multiple cryptos', async () => {
            const mockData = [
                {
                    symbol: 'btc',
                    name: 'Bitcoin',
                    current_price: 50000,
                    total_volume: 1000000000,
                    market_cap: 900000000000,
                    price_change_percentage_24h: 2.5,
                    high_24h: 51000,
                    low_24h: 49000,
                    circulating_supply: 19000000,
                    total_supply: 21000000,
                    ath: 69000,
                    ath_change_percentage: -27.5,
                    atl: 67,
                    atl_change_percentage: 74527,
                },
                {
                    symbol: 'eth',
                    name: 'Ethereum',
                    current_price: 3500,
                    total_volume: 500000000,
                    market_cap: 400000000000,
                    price_change_percentage_24h: -1.2,
                    high_24h: 3600,
                    low_24h: 3400,
                    circulating_supply: 120000000,
                    total_supply: null,
                    ath: 4800,
                    ath_change_percentage: -27,
                    atl: 0.42,
                    atl_change_percentage: 833233,
                },
            ];

            fetchCryptoData.mockResolvedValue(mockData);
            prisma.cryptos.findUnique
                .mockResolvedValueOnce(null) // BTC is new
                .mockResolvedValueOnce({ id: 2, symbol: 'eth' }); // ETH exists
            prisma.cryptos.create.mockResolvedValue({ id: 1, symbol: 'btc' });
            prisma.crypto_prices.create.mockResolvedValue({});

            await insertCryptoData();

            expect(prisma.cryptos.create).toHaveBeenCalledTimes(1); // Only BTC created
            expect(prisma.crypto_prices.create).toHaveBeenCalledTimes(2); // Both prices inserted
        });

        it('handles API fetch error', async () => {
            fetchCryptoData.mockRejectedValue(new Error('API Error'));

            await insertCryptoData();

            expect(logError).toHaveBeenCalledWith(expect.stringContaining("Erreur"), 'API Error');
            expect(console.error).toHaveBeenCalled();
        });

        it('handles database error during crypto creation', async () => {
            const mockData = [
                {
                    symbol: 'sol',
                    name: 'Solana',
                    current_price: 150,
                    total_volume: 100000000,
                    market_cap: 50000000000,
                    price_change_percentage_24h: 5,
                    high_24h: 155,
                    low_24h: 145,
                    circulating_supply: 400000000,
                    total_supply: 500000000,
                    ath: 260,
                    ath_change_percentage: -42,
                    atl: 0.5,
                    atl_change_percentage: 29900,
                },
            ];

            fetchCryptoData.mockResolvedValue(mockData);
            prisma.cryptos.findUnique.mockResolvedValue(null);
            prisma.cryptos.create.mockRejectedValue(new Error('DB constraint violation'));

            await insertCryptoData();

            expect(logError).toHaveBeenCalledWith(expect.stringContaining("Erreur"), 'DB constraint violation');
        });

        it('handles database error during price insertion', async () => {
            const mockData = [
                {
                    symbol: 'ada',
                    name: 'Cardano',
                    current_price: 0.45,
                    total_volume: 200000000,
                    market_cap: 15000000000,
                    price_change_percentage_24h: -3,
                    high_24h: 0.48,
                    low_24h: 0.43,
                    circulating_supply: 35000000000,
                    total_supply: 45000000000,
                    ath: 3.1,
                    ath_change_percentage: -85,
                    atl: 0.017,
                    atl_change_percentage: 2547,
                },
            ];

            fetchCryptoData.mockResolvedValue(mockData);
            prisma.cryptos.findUnique.mockResolvedValue({ id: 5, symbol: 'ada' });
            prisma.crypto_prices.create.mockRejectedValue(new Error('Price insert failed'));

            await insertCryptoData();

            expect(logError).toHaveBeenCalled();
        });

        it('logs price info correctly', async () => {
            const mockData = [
                {
                    symbol: 'doge',
                    name: 'Dogecoin',
                    current_price: 0.15,
                    total_volume: 300000000,
                    market_cap: 20000000000,
                    price_change_percentage_24h: 10,
                    high_24h: 0.16,
                    low_24h: 0.14,
                    circulating_supply: 140000000000,
                    total_supply: null,
                    ath: 0.73,
                    ath_change_percentage: -79,
                    atl: 0.00008,
                    atl_change_percentage: 187400,
                },
            ];

            fetchCryptoData.mockResolvedValue(mockData);
            prisma.cryptos.findUnique.mockResolvedValue({ id: 10, symbol: 'doge' });
            prisma.crypto_prices.create.mockResolvedValue({});

            await insertCryptoData();

            expect(logInfo).toHaveBeenCalledWith(expect.stringContaining('Dogecoin'));
            expect(logInfo).toHaveBeenCalledWith(expect.stringContaining('0.15'));
        });
    });
});
