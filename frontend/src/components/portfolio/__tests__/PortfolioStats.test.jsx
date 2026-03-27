import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PortfolioStats from '../PortfolioStats';

// Mock js-cookie
vi.mock('js-cookie', () => ({
    default: {
        get: vi.fn(() => 'fake-token'),
    },
}));

global.fetch = vi.fn();

const mockPortfolio = {
    holdings: { btc: 0.5 },
    transactions: [
        {
            id: 1,
            crypto_id: 1,
            crypto: { symbol: 'btc' },
            type: 'buy',
            quantity: 0.5,
            price_usd: 40000,
            timestamp: new Date(Date.now() - 86400000).toISOString(),
        },
    ],
};

const mockPrices = [
    { crypto_id: 1, price_usd: 50000, change_percent_24h: 2.0 },
];

describe('PortfolioStats', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        global.fetch.mockImplementation((url) => {
            if (url.includes('/portfolio/me')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockPortfolio,
                });
            }
            if (url.includes('/prices')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockPrices,
                });
            }
            return Promise.resolve({ ok: true, json: async () => {} });
        });
    });

    it('shows loading skeleton initially', () => {
        global.fetch.mockReturnValue(new Promise(() => {}));
        render(<PortfolioStats />);
        const skeletons = document.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders Total Portfolio Value card', async () => {
        render(<PortfolioStats />);

        await waitFor(() => {
            expect(screen.getByText('Total Portfolio Value')).toBeInTheDocument();
        });
    });

    it("renders Today's Profit card", async () => {
        render(<PortfolioStats />);

        await waitFor(() => {
            expect(screen.getByText("Today's Profit")).toBeInTheDocument();
        });
    });

    it('renders Total Profit card', async () => {
        render(<PortfolioStats />);

        await waitFor(() => {
            expect(screen.getByText('Total Profit')).toBeInTheDocument();
        });
    });

    it('renders Assets Held card', async () => {
        render(<PortfolioStats />);

        await waitFor(() => {
            expect(screen.getByText('Assets Held')).toBeInTheDocument();
        });
    });

    it('displays total portfolio value correctly', async () => {
        render(<PortfolioStats />);

        await waitFor(() => {
            // 0.5 BTC * $50,000 = $25,000
            expect(screen.getByText(/\$25,000/)).toBeInTheDocument();
        });
    });

    it('displays assets count', async () => {
        render(<PortfolioStats />);

        await waitFor(() => {
            // 1 asset in holdings
            expect(screen.getByText('1')).toBeInTheDocument();
        });
    });

    it('displays today profit label', async () => {
        render(<PortfolioStats />);

        await waitFor(() => {
            expect(screen.getByText('today')).toBeInTheDocument();
        });
    });

    it('renders 4 stat cards', async () => {
        render(<PortfolioStats />);

        await waitFor(() => {
            const cards = document.querySelectorAll('.rounded-2xl.p-6');
            expect(cards.length).toBe(4);
        });
    });

    it('does not fetch when no token', async () => {
        const Cookies = (await import('js-cookie')).default;
        Cookies.get.mockReturnValueOnce(null);

        render(<PortfolioStats />);

        await waitFor(() => {
            expect(global.fetch).not.toHaveBeenCalled();
        });
    });

    it('handles fetch error gracefully', async () => {
        global.fetch.mockRejectedValue(new Error('Network error'));

        render(<PortfolioStats />);

        await waitFor(() => {
            // Should render without crashing after error
            expect(screen.queryByText('Chargement…')).not.toBeInTheDocument();
        });
    });

    it('shows sell transactions in profit calculation', async () => {
        global.fetch.mockImplementation((url) => {
            if (url.includes('/portfolio/me')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        holdings: { btc: 0.25 },
                        transactions: [
                            {
                                id: 1,
                                crypto_id: 1,
                                crypto: { symbol: 'btc' },
                                type: 'buy',
                                quantity: 0.5,
                                price_usd: 40000,
                                timestamp: new Date(Date.now() - 86400000).toISOString(),
                            },
                            {
                                id: 2,
                                crypto_id: 1,
                                crypto: { symbol: 'btc' },
                                type: 'sell',
                                quantity: 0.25,
                                price_usd: 50000,
                                timestamp: new Date().toISOString(),
                            },
                        ],
                    }),
                });
            }
            if (url.includes('/prices')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockPrices,
                });
            }
            return Promise.resolve({ ok: true, json: async () => {} });
        });

        render(<PortfolioStats />);

        await waitFor(() => {
            expect(screen.getByText('Total Profit')).toBeInTheDocument();
        });
    });

    it('handles empty portfolio', async () => {
        global.fetch.mockImplementation((url) => {
            if (url.includes('/portfolio/me')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ holdings: {}, transactions: [] }),
                });
            }
            if (url.includes('/prices')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => [],
                });
            }
            return Promise.resolve({ ok: true, json: async () => {} });
        });

        render(<PortfolioStats />);

        await waitFor(() => {
            expect(screen.getByText('Total Portfolio Value')).toBeInTheDocument();
            expect(screen.getByText('0')).toBeInTheDocument(); // assets count
        });
    });
});
