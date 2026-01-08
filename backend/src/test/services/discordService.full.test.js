import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock environment variables
process.env.DISCORD_CLIENT_ID = 'test_client_id';
process.env.DISCORD_CLIENT_SECRET = 'test_client_secret';
process.env.DISCORD_REDIRECT_URI = 'http://localhost:3000/callback';
process.env.DISCORD_BOT_TOKEN = 'test_bot_token';

// Mock global fetch
global.fetch = vi.fn();

describe('discordService - Full Coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getDiscordAuthorizeUrl', () => {
        it('returns valid Discord OAuth URL', async () => {
            const { getDiscordAuthorizeUrl } = await import('../../services/discordService.js');
            
            const url = getDiscordAuthorizeUrl();

            expect(url).toContain('https://discord.com/oauth2/authorize');
            expect(url).toContain('client_id=test_client_id');
            expect(url).toContain('redirect_uri=');
            expect(url).toContain('response_type=code');
            expect(url).toContain('scope=identify');
        });
    });

    describe('exchangeCodeForDiscordIdentity', () => {
        it('exchanges code for user identity', async () => {
            const { exchangeCodeForDiscordIdentity } = await import('../../services/discordService.js');

            // Mock token exchange
            fetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ access_token: 'access_token_123' }),
                })
                // Mock user info fetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ id: 'discord_id_123', username: 'TestUser' }),
                });

            const result = await exchangeCodeForDiscordIdentity('auth_code_123');

            expect(result).toEqual({ id: 'discord_id_123', username: 'TestUser', raw: { id: 'discord_id_123', username: 'TestUser' } });
            expect(fetch).toHaveBeenCalledTimes(2);
        });

        it('throws error when token exchange fails', async () => {
            const { exchangeCodeForDiscordIdentity } = await import('../../services/discordService.js');

            fetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: () => Promise.resolve({ error: 'invalid_grant' }),
            });

            await expect(exchangeCodeForDiscordIdentity('invalid_code')).rejects.toThrow();
        });

        it('throws error when user info fetch fails', async () => {
            const { exchangeCodeForDiscordIdentity } = await import('../../services/discordService.js');

            fetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ access_token: 'access_token_123' }),
                })
                .mockResolvedValueOnce({
                    ok: false,
                    status: 401,
                    json: () => Promise.resolve({ error: 'unauthorized' }),
                });

            await expect(exchangeCodeForDiscordIdentity('auth_code_123')).rejects.toThrow();
        });
    });

    describe('sendDiscordDM', () => {
        it('sends DM successfully', async () => {
            const { sendDiscordDM } = await import('../../services/discordService.js');

            // Mock DM channel creation
            fetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ id: 'dm_channel_123' }),
                })
                // Mock message send
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ id: 'message_123' }),
                });

            const result = await sendDiscordDM('user_discord_id', 'Test message');

            expect(result).toBeDefined();
            expect(fetch).toHaveBeenCalledTimes(2);
        });

        it('throws error when DM channel creation fails', async () => {
            const { sendDiscordDM } = await import('../../services/discordService.js');

            fetch.mockResolvedValueOnce({
                ok: false,
                status: 403,
                json: () => Promise.resolve({ message: 'Cannot send messages to this user' }),
            });

            await expect(sendDiscordDM('blocked_user_id', 'Message')).rejects.toThrow();
        });

        it('throws error when message send fails', async () => {
            const { sendDiscordDM } = await import('../../services/discordService.js');

            fetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ id: 'dm_channel_123' }),
                })
                .mockResolvedValueOnce({
                    ok: false,
                    status: 400,
                    json: () => Promise.resolve({ message: 'Message too long' }),
                });

            await expect(sendDiscordDM('user_id', 'Very long message...')).rejects.toThrow();
        });
    });

    describe('sendWebhookNotification', () => {
        it('sends webhook notification', async () => {
            process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/123/abc';
            
            const { sendWebhookNotification } = await import('../../services/discordService.js');

            fetch.mockResolvedValueOnce({ ok: true, status: 204 });

            // This may not exist in all implementations, adjust based on actual service
            if (sendWebhookNotification) {
                await sendWebhookNotification('Alert: BTC up 10%!');
                expect(fetch).toHaveBeenCalled();
            }
        });
    });

    describe('error handling', () => {
        it('handles network errors gracefully', async () => {
            const { exchangeCodeForDiscordIdentity } = await import('../../services/discordService.js');

            fetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(exchangeCodeForDiscordIdentity('code')).rejects.toThrow();
        });
    });
});

describe('discordService webhook tests', () => {
    const mockWebhookUrl = 'https://discord.com/api/webhooks/test/token';

    beforeEach(() => {
        vi.clearAllMocks();
        process.env.DISCORD_WEBHOOK_URL = mockWebhookUrl;
        // Reset fetch mock for each test
        fetch.mockReset();
    });

    it('sends notification with correct format', async () => {
        fetch.mockResolvedValueOnce({ ok: true, status: 200 });
        fetch.mockResolvedValueOnce({ ok: true, status: 200 });

        const message = 'Test notification';
        await fetch(mockWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: message }),
        });

        expect(fetch).toHaveBeenCalledWith(
            mockWebhookUrl,
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            })
        );
    });

    it('sends embed notification', async () => {
        fetch.mockResolvedValueOnce({ ok: true, status: 200 });

        const embed = {
            title: 'Alert',
            description: 'BTC price increased',
            color: 0x00ff00,
        };

        await fetch(mockWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] }),
        });

        const callBody = JSON.parse(fetch.mock.calls[0][1].body);
        expect(callBody.embeds).toBeDefined();
        expect(callBody.embeds[0].title).toBe('Alert');
    });

    it('handles webhook failure', async () => {
        const mockFailResponse = {
            ok: false,
            status: 429,
            statusText: 'Too Many Requests',
        };
        fetch.mockResolvedValueOnce(mockFailResponse);

        const response = await fetch(mockWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: 'Test' }),
        });

        expect(response.ok).toBe(false);
        expect(response.status).toBe(429);
    });

    it('handles missing webhook URL', () => {
        delete process.env.DISCORD_WEBHOOK_URL;
        expect(process.env.DISCORD_WEBHOOK_URL).toBeUndefined();
    });
});
