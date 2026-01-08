import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock prisma
vi.mock('../../services/dbService.js', () => ({
    prisma: {
        cryptos: {
            findUnique: vi.fn(),
        },
        crypto_prices: {
            findFirst: vi.fn(),
        },
        alerts: {
            create: vi.fn(),
            findMany: vi.fn(),
            findFirst: vi.fn(),
            delete: vi.fn(),
            update: vi.fn(),
        },
    },
}));

// Mock logger
vi.mock('../../utils/logger.js', () => ({
    logInfo: vi.fn(),
    logError: vi.fn(),
}));

// Mock discord service
vi.mock('../../services/discordService.js', () => ({
    sendDiscordDM: vi.fn(),
}));

import { prisma } from '../../services/dbService.js';
import { logInfo, logError } from '../../utils/logger.js';
import { sendDiscordDM } from '../../services/discordService.js';
import {
    checkAlert,
    createAlert,
    listMyAlerts,
    deleteMyAlert,
    resetMyAlert,
    processPendingAlerts,
} from '../../services/alertsService.js';

describe('alertsService - Full Coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('checkAlert', () => {
        it('returns null when crypto not found', async () => {
            prisma.cryptos.findUnique.mockResolvedValue(null);

            const result = await checkAlert('UNKNOWN', 5, -5);

            expect(result).toBeNull();
            expect(logError).toHaveBeenCalled();
        });

        it('returns null when no price data available', async () => {
            prisma.cryptos.findUnique.mockResolvedValue({ id: 1, name: 'Bitcoin', symbol: 'btc' });
            prisma.crypto_prices.findFirst.mockResolvedValue(null);

            const result = await checkAlert('btc', 5, -5);

            expect(result).toBeNull();
            expect(logError).toHaveBeenCalled();
        });

        it('detects UP alert when variation exceeds threshold', async () => {
            prisma.cryptos.findUnique.mockResolvedValue({ id: 1, name: 'Bitcoin', symbol: 'btc' });
            prisma.crypto_prices.findFirst.mockResolvedValue({
                price_usd: 50000,
                change_percent_24h: 10,
            });

            const result = await checkAlert('btc', 5, -5);

            expect(result).toEqual({
                symbol: 'btc',
                price: 50000,
                variation_24h: 10,
                alert: true,
                alertType: 'increase_5%',
            });
        });

        it('detects DOWN alert when variation below threshold', async () => {
            prisma.cryptos.findUnique.mockResolvedValue({ id: 1, name: 'Bitcoin', symbol: 'btc' });
            prisma.crypto_prices.findFirst.mockResolvedValue({
                price_usd: 45000,
                change_percent_24h: -10,
            });

            const result = await checkAlert('btc', 5, -5);

            expect(result).toEqual({
                symbol: 'btc',
                price: 45000,
                variation_24h: -10,
                alert: true,
                alertType: 'decrease_-5%',
            });
        });

        it('returns no alert when variation within thresholds', async () => {
            prisma.cryptos.findUnique.mockResolvedValue({ id: 1, name: 'Bitcoin', symbol: 'btc' });
            prisma.crypto_prices.findFirst.mockResolvedValue({
                price_usd: 48000,
                change_percent_24h: 2,
            });

            const result = await checkAlert('btc', 5, -5);

            expect(result).toEqual({
                symbol: 'btc',
                price: 48000,
                variation_24h: 2,
                alert: false,
                alertType: null,
            });
        });
    });

    describe('createAlert', () => {
        it('creates alert successfully', async () => {
            prisma.cryptos.findUnique.mockResolvedValue({ id: 1, symbol: 'btc' });
            prisma.alerts.create.mockResolvedValue({
                id: 1,
                user_id: 1,
                crypto_id: 1,
                alert_type: 'PERCENT_UP',
                threshold: 10,
                is_triggered: false,
            });

            const result = await createAlert({
                userId: 1,
                symbol: 'BTC',
                type: 'percent_up',
                threshold: 10,
            });

            expect(result.id).toBe(1);
            expect(result.alert_type).toBe('PERCENT_UP');
        });

        it('throws error for unsupported alert type', async () => {
            await expect(
                createAlert({ userId: 1, symbol: 'BTC', type: 'INVALID_TYPE', threshold: 10 })
            ).rejects.toThrow('Unsupported alert type');
        });

        it('throws error when crypto not found', async () => {
            prisma.cryptos.findUnique.mockResolvedValue(null);

            await expect(
                createAlert({ userId: 1, symbol: 'UNKNOWN', type: 'PERCENT_UP', threshold: 10 })
            ).rejects.toThrow('Crypto introuvable');
        });

        it('normalizes symbol to lowercase', async () => {
            prisma.cryptos.findUnique.mockResolvedValue({ id: 1, symbol: 'btc' });
            prisma.alerts.create.mockResolvedValue({ id: 1 });

            await createAlert({ userId: 1, symbol: '  BTC  ', type: 'PERCENT_UP', threshold: 10 });

            expect(prisma.cryptos.findUnique).toHaveBeenCalledWith({ where: { symbol: 'btc' } });
        });

        it('supports all alert types', async () => {
            prisma.cryptos.findUnique.mockResolvedValue({ id: 1, symbol: 'btc' });
            prisma.alerts.create.mockResolvedValue({ id: 1 });

            const types = ['PERCENT_UP', 'PERCENT_DOWN', 'PRICE_ABOVE', 'PRICE_BELOW'];
            for (const type of types) {
                await createAlert({ userId: 1, symbol: 'BTC', type, threshold: 10 });
            }

            expect(prisma.alerts.create).toHaveBeenCalledTimes(4);
        });
    });

    describe('listMyAlerts', () => {
        it('returns user alerts with crypto info', async () => {
            const mockAlerts = [
                { id: 1, alert_type: 'PERCENT_UP', threshold: 5, cryptos: { symbol: 'btc' } },
                { id: 2, alert_type: 'PRICE_BELOW', threshold: 40000, cryptos: { symbol: 'btc' } },
            ];
            prisma.alerts.findMany.mockResolvedValue(mockAlerts);

            const result = await listMyAlerts(1);

            expect(result).toEqual(mockAlerts);
            expect(prisma.alerts.findMany).toHaveBeenCalledWith({
                where: { user_id: 1 },
                orderBy: { created_at: 'desc' },
                include: { cryptos: true },
            });
        });

        it('returns empty array when no alerts', async () => {
            prisma.alerts.findMany.mockResolvedValue([]);

            const result = await listMyAlerts(1);

            expect(result).toEqual([]);
        });
    });

    describe('deleteMyAlert', () => {
        it('deletes alert successfully', async () => {
            prisma.alerts.findFirst.mockResolvedValue({ id: 1, user_id: 1 });
            prisma.alerts.delete.mockResolvedValue({});

            await deleteMyAlert({ userId: 1, alertId: 1 });

            expect(prisma.alerts.delete).toHaveBeenCalledWith({ where: { id: 1 } });
        });

        it('throws error when alert not found', async () => {
            prisma.alerts.findFirst.mockResolvedValue(null);

            await expect(deleteMyAlert({ userId: 1, alertId: 999 })).rejects.toThrow('Alert not found');
        });
    });

    describe('resetMyAlert', () => {
        it('resets alert successfully', async () => {
            prisma.alerts.findFirst.mockResolvedValue({ id: 1, user_id: 1, is_triggered: true });
            prisma.alerts.update.mockResolvedValue({
                id: 1,
                is_triggered: false,
                triggered_at: null,
            });

            const result = await resetMyAlert({ userId: 1, alertId: 1 });

            expect(result.is_triggered).toBe(false);
            expect(result.triggered_at).toBeNull();
        });

        it('throws error when alert not found', async () => {
            prisma.alerts.findFirst.mockResolvedValue(null);

            await expect(resetMyAlert({ userId: 1, alertId: 999 })).rejects.toThrow('Alert not found');
        });
    });

    describe('processPendingAlerts', () => {
        it('processes pending alerts and sends notifications', async () => {
            const mockAlerts = [
                {
                    id: 1,
                    user_id: 1,
                    crypto_id: 1,
                    alert_type: 'PRICE_ABOVE',
                    threshold: 40000,
                    user: { id: 1, pseudo: 'testuser', discord_user_id: 'discord123' },
                    cryptos: { id: 1, symbol: 'btc' },
                },
            ];
            prisma.alerts.findMany.mockResolvedValue(mockAlerts);
            prisma.crypto_prices.findFirst.mockResolvedValue({
                price_usd: 50000,
                change_percent_24h: 5,
            });
            sendDiscordDM.mockResolvedValue({ success: true });
            prisma.alerts.update.mockResolvedValue({});

            const result = await processPendingAlerts();

            expect(result.pending).toBe(1);
            expect(sendDiscordDM).toHaveBeenCalled();
            expect(prisma.alerts.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { is_triggered: true, triggered_at: expect.any(Date) },
            });
        });

        it('skips alerts without user or crypto', async () => {
            const mockAlerts = [
                { id: 1, user: null, cryptos: { symbol: 'btc' } },
                { id: 2, user: { id: 1 }, cryptos: null },
            ];
            prisma.alerts.findMany.mockResolvedValue(mockAlerts);

            const result = await processPendingAlerts();

            expect(result.eligible).toBe(0);
            expect(sendDiscordDM).not.toHaveBeenCalled();
        });

        it('skips alerts without price data', async () => {
            const mockAlerts = [
                {
                    id: 1,
                    user: { id: 1, discord_user_id: 'discord123' },
                    cryptos: { symbol: 'btc' },
                    alert_type: 'PRICE_ABOVE',
                    threshold: 40000,
                },
            ];
            prisma.alerts.findMany.mockResolvedValue(mockAlerts);
            prisma.crypto_prices.findFirst.mockResolvedValue(null);

            const result = await processPendingAlerts();

            expect(result.triggered).toBe(0);
        });

        it('logs info when user has no discord connected', async () => {
            const mockAlerts = [
                {
                    id: 1,
                    user: { id: 1, pseudo: 'testuser', discord_user_id: null },
                    cryptos: { id: 1, symbol: 'btc' },
                    alert_type: 'PRICE_ABOVE',
                    threshold: 40000,
                },
            ];
            prisma.alerts.findMany.mockResolvedValue(mockAlerts);
            prisma.crypto_prices.findFirst.mockResolvedValue({
                price_usd: 50000,
                change_percent_24h: 5,
            });

            await processPendingAlerts();

            expect(logInfo).toHaveBeenCalledWith(expect.stringContaining('Discord not connected'));
            expect(sendDiscordDM).not.toHaveBeenCalled();
        });

        it('handles Discord notification failure', async () => {
            const mockAlerts = [
                {
                    id: 1,
                    user: { id: 1, pseudo: 'testuser', discord_user_id: 'discord123' },
                    cryptos: { id: 1, symbol: 'btc' },
                    alert_type: 'PRICE_ABOVE',
                    threshold: 40000,
                },
            ];
            prisma.alerts.findMany.mockResolvedValue(mockAlerts);
            prisma.crypto_prices.findFirst.mockResolvedValue({
                price_usd: 50000,
                change_percent_24h: 5,
            });
            sendDiscordDM.mockRejectedValue(new Error('Discord API error'));

            const result = await processPendingAlerts();

            expect(logError).toHaveBeenCalled();
            expect(result.notified).toBe(0);
            expect(prisma.alerts.update).not.toHaveBeenCalled();
        });

        it('tests all alert type conditions', async () => {
            const alertTypes = [
                { type: 'PRICE_ABOVE', threshold: 40000, price: 50000, change: 0, shouldTrigger: true },
                { type: 'PRICE_BELOW', threshold: 60000, price: 50000, change: 0, shouldTrigger: true },
                { type: 'PERCENT_UP', threshold: 5, price: 50000, change: 10, shouldTrigger: true },
                { type: 'PERCENT_DOWN', threshold: -5, price: 50000, change: -10, shouldTrigger: true },
                { type: 'PRICE_ABOVE', threshold: 60000, price: 50000, change: 0, shouldTrigger: false },
            ];

            for (const alertConfig of alertTypes) {
                vi.clearAllMocks();

                const mockAlerts = [
                    {
                        id: 1,
                        user: { id: 1, pseudo: 'test', discord_user_id: 'discord123' },
                        cryptos: { id: 1, symbol: 'btc' },
                        alert_type: alertConfig.type,
                        threshold: alertConfig.threshold,
                    },
                ];
                prisma.alerts.findMany.mockResolvedValue(mockAlerts);
                prisma.crypto_prices.findFirst.mockResolvedValue({
                    price_usd: alertConfig.price,
                    change_percent_24h: alertConfig.change,
                });
                sendDiscordDM.mockResolvedValue({});
                prisma.alerts.update.mockResolvedValue({});

                const result = await processPendingAlerts();

                if (alertConfig.shouldTrigger) {
                    expect(result.eligible).toBeGreaterThan(0);
                } else {
                    expect(result.eligible).toBe(0);
                }
            }
        });

        it('handles null change_percent_24h for percent alerts', async () => {
            const mockAlerts = [
                {
                    id: 1,
                    user: { id: 1, pseudo: 'test', discord_user_id: 'discord123' },
                    cryptos: { id: 1, symbol: 'btc' },
                    alert_type: 'PERCENT_UP',
                    threshold: 5,
                },
            ];
            prisma.alerts.findMany.mockResolvedValue(mockAlerts);
            prisma.crypto_prices.findFirst.mockResolvedValue({
                price_usd: 50000,
                change_percent_24h: null,
            });

            const result = await processPendingAlerts();

            expect(result.eligible).toBe(0);
        });
    });
});
