const { describe, it, expect, beforeEach, afterEach, vi } = require('@jest/globals');
const discordService = require('../../services/discordService');

global.fetch = vi.fn();

describe('Discord Service', () => {
  const mockWebhookUrl = 'https://discord.com/api/webhooks/test';
  
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DISCORD_WEBHOOK_URL = mockWebhookUrl;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.DISCORD_WEBHOOK_URL;
  });

  describe('sendNotification', () => {
    it('sends notification successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const result = await discordService.sendNotification('Test message');

      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        mockWebhookUrl,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Test message')
        })
      );
    });

    it('formats message with embed', async () => {
      fetch.mockResolvedValueOnce({ ok: true });

      await discordService.sendNotification('Alert', {
        title: 'Test Alert',
        description: 'Test description',
        color: 0xFF0000
      });

      const callArg = fetch.mock.calls[0][1].body;
      const body = JSON.parse(callArg);
      
      expect(body.embeds).toBeDefined();
      expect(body.embeds[0].title).toBe('Test Alert');
      expect(body.embeds[0].description).toBe('Test description');
      expect(body.embeds[0].color).toBe(0xFF0000);
    });

    it('handles API errors gracefully', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      const result = await discordService.sendNotification('Test');

      expect(result).toBe(false);
    });

    it('handles network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await discordService.sendNotification('Test');

      expect(result).toBe(false);
    });

    it('returns false when webhook URL is not configured', async () => {
      delete process.env.DISCORD_WEBHOOK_URL;

      const result = await discordService.sendNotification('Test');

      expect(result).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('sendAlert', () => {
    it('sends alert with correct format', async () => {
      fetch.mockResolvedValueOnce({ ok: true });

      const alert = {
        type: 'price',
        crypto: 'BTC',
        condition: 'above',
        targetPrice: 50000,
        currentPrice: 51000
      };

      await discordService.sendAlert(alert);

      const callArg = fetch.mock.calls[0][1].body;
      const body = JSON.parse(callArg);
      
      expect(body.embeds[0].title).toContain('Alerte Prix');
      expect(body.embeds[0].fields).toBeDefined();
      expect(body.embeds[0].fields.length).toBeGreaterThan(0);
    });

    it('uses red color for critical alerts', async () => {
      fetch.mockResolvedValueOnce({ ok: true });

      await discordService.sendAlert({ type: 'critical', message: 'Critical' });

      const callArg = fetch.mock.calls[0][1].body;
      const body = JSON.parse(callArg);
      
      expect(body.embeds[0].color).toBe(0xFF0000);
    });

    it('uses yellow color for warning alerts', async () => {
      fetch.mockResolvedValueOnce({ ok: true });

      await discordService.sendAlert({ type: 'warning', message: 'Warning' });

      const callArg = fetch.mock.calls[0][1].body;
      const body = JSON.parse(callArg);
      
      expect(body.embeds[0].color).toBe(0xFFA500);
    });

    it('uses green color for success alerts', async () => {
      fetch.mockResolvedValueOnce({ ok: true });

      await discordService.sendAlert({ type: 'success', message: 'Success' });

      const callArg = fetch.mock.calls[0][1].body;
      const body = JSON.parse(callArg);
      
      expect(body.embeds[0].color).toBe(0x00FF00);
    });
  });

  describe('sendTradeNotification', () => {
    it('sends trade notification successfully', async () => {
      fetch.mockResolvedValueOnce({ ok: true });

      const trade = {
        type: 'buy',
        crypto: 'BTC',
        amount: 0.5,
        price: 50000,
        total: 25000
      };

      await discordService.sendTradeNotification(trade);

      const callArg = fetch.mock.calls[0][1].body;
      const body = JSON.parse(callArg);
      
      expect(body.embeds[0].title).toContain('Trade');
      expect(body.embeds[0].fields).toBeDefined();
    });

    it('formats buy trades correctly', async () => {
      fetch.mockResolvedValueOnce({ ok: true });

      await discordService.sendTradeNotification({
        type: 'buy',
        crypto: 'ETH',
        amount: 2,
        price: 3000
      });

      const callArg = fetch.mock.calls[0][1].body;
      const body = JSON.parse(callArg);
      
      expect(body.embeds[0].color).toBe(0x00FF00);
      expect(body.embeds[0].title).toContain('Achat');
    });

    it('formats sell trades correctly', async () => {
      fetch.mockResolvedValueOnce({ ok: true });

      await discordService.sendTradeNotification({
        type: 'sell',
        crypto: 'ETH',
        amount: 2,
        price: 3000
      });

      const callArg = fetch.mock.calls[0][1].body;
      const body = JSON.parse(callArg);
      
      expect(body.embeds[0].color).toBe(0xFF0000);
      expect(body.embeds[0].title).toContain('Vente');
    });
  });
});
