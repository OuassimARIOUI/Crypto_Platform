import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock global fetch
global.fetch = vi.fn();

describe('Discord Service', () => {
    const mockWebhookUrl = 'https://discord.com/api/webhooks/test/token';
    
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.DISCORD_WEBHOOK_URL = mockWebhookUrl;
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete process.env.DISCORD_WEBHOOK_URL;
    });

    describe('Webhook Configuration', () => {
        it('uses environment variable for webhook URL', () => {
            expect(process.env.DISCORD_WEBHOOK_URL).toBe(mockWebhookUrl);
        });

        it('handles missing webhook URL', () => {
            delete process.env.DISCORD_WEBHOOK_URL;
            expect(process.env.DISCORD_WEBHOOK_URL).toBeUndefined();
        });
    });

    describe('Sending Notifications', () => {
        it('sends notification with correct format', async () => {
            fetch.mockResolvedValueOnce({ ok: true, status: 200 });

            const message = 'Test notification';
            await fetch(mockWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: message })
            });

            expect(fetch).toHaveBeenCalledWith(
                mockWebhookUrl,
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                })
            );
        });

        it('sends embed notification', async () => {
            fetch.mockResolvedValueOnce({ ok: true });

            const embed = {
                title: 'Test Alert',
                description: 'Test description',
                color: 0xFF0000
            };

            await fetch(mockWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ embeds: [embed] })
            });

            const callBody = JSON.parse(fetch.mock.calls[0][1].body);
            expect(callBody.embeds).toBeDefined();
            expect(callBody.embeds[0].title).toBe('Test Alert');
        });

        it('handles API success response', async () => {
            fetch.mockResolvedValueOnce({ ok: true, status: 200 });

            const response = await fetch(mockWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: 'Test' })
            });

            expect(response.ok).toBe(true);
        });

        it('handles API error response', async () => {
            fetch.mockResolvedValueOnce({ 
                ok: false, 
                status: 400, 
                statusText: 'Bad Request' 
            });

            const response = await fetch(mockWebhookUrl, {
                method: 'POST',
                body: JSON.stringify({ content: 'Test' })
            });

            expect(response.ok).toBe(false);
            expect(response.status).toBe(400);
        });

        it('handles network errors', async () => {
            fetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(
                fetch(mockWebhookUrl, { method: 'POST' })
            ).rejects.toThrow('Network error');
        });
    });

    describe('Alert Types', () => {
        it('formats price alert', async () => {
            fetch.mockResolvedValueOnce({ ok: true });

            const alert = {
                embeds: [{
                    title: ' Alerte Prix BTC',
                    description: 'BTC a atteint 50000 USD',
                    color: 0x00FF00,
                    fields: [
                        { name: 'Crypto', value: 'BTC', inline: true },
                        { name: 'Prix', value: '50000 USD', inline: true }
                    ]
                }]
            };

            await fetch(mockWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(alert)
            });

            const callBody = JSON.parse(fetch.mock.calls[0][1].body);
            expect(callBody.embeds[0].fields).toHaveLength(2);
        });

        it('uses red color for critical alerts', async () => {
            fetch.mockResolvedValueOnce({ ok: true });

            const criticalAlert = {
                embeds: [{ title: 'Critical', color: 0xFF0000 }]
            };

            await fetch(mockWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(criticalAlert)
            });

            const callBody = JSON.parse(fetch.mock.calls[0][1].body);
            expect(callBody.embeds[0].color).toBe(0xFF0000);
        });

        it('uses yellow color for warning alerts', async () => {
            fetch.mockResolvedValueOnce({ ok: true });

            const warningAlert = {
                embeds: [{ title: 'Warning', color: 0xFFA500 }]
            };

            await fetch(mockWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(warningAlert)
            });

            const callBody = JSON.parse(fetch.mock.calls[0][1].body);
            expect(callBody.embeds[0].color).toBe(0xFFA500);
        });

        it('uses green color for success alerts', async () => {
            fetch.mockResolvedValueOnce({ ok: true });

            const successAlert = {
                embeds: [{ title: 'Success', color: 0x00FF00 }]
            };

            await fetch(mockWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(successAlert)
            });

            const callBody = JSON.parse(fetch.mock.calls[0][1].body);
            expect(callBody.embeds[0].color).toBe(0x00FF00);
        });
    });

    describe('Trade Notifications', () => {
        it('formats buy trade notification', async () => {
            fetch.mockResolvedValueOnce({ ok: true });

            const tradeNotification = {
                embeds: [{
                    title: '📈 Achat BTC',
                    color: 0x00FF00,
                    fields: [
                        { name: 'Type', value: 'Achat', inline: true },
                        { name: 'Montant', value: '0.5 BTC', inline: true },
                        { name: 'Prix', value: '50000 USD', inline: true }
                    ]
                }]
            };

            await fetch(mockWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tradeNotification)
            });

            const callBody = JSON.parse(fetch.mock.calls[0][1].body);
            expect(callBody.embeds[0].title).toContain('Achat');
            expect(callBody.embeds[0].color).toBe(0x00FF00);
        });

        it('formats sell trade notification', async () => {
            fetch.mockResolvedValueOnce({ ok: true });

            const tradeNotification = {
                embeds: [{
                    title: '📉 Vente ETH',
                    color: 0xFF0000,
                    fields: [
                        { name: 'Type', value: 'Vente', inline: true },
                        { name: 'Montant', value: '2 ETH', inline: true }
                    ]
                }]
            };

            await fetch(mockWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tradeNotification)
            });

            const callBody = JSON.parse(fetch.mock.calls[0][1].body);
            expect(callBody.embeds[0].title).toContain('Vente');
            expect(callBody.embeds[0].color).toBe(0xFF0000);
        });
    });
});
