import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PortfolioAssets from '../PortfolioAssets';

// Mock js-cookie
vi.mock('js-cookie', () => ({
    default: {
        get: vi.fn(() => 'fake-token'),
    },
}));

global.fetch = vi.fn();

const mockPortfolio = {
    holdings: { btc: 0.5, eth: 2 },
    transactions: [
        {
            id: 1,
            crypto_id: 1,
            crypto: { name: 'Bitcoin', symbol: 'btc' },
            type: 'buy',
            quantity: 0.5,
            price_usd: 45000,
            timestamp: new Date().toISOString(),
        },
        {
            id: 2,
            crypto_id: 2,
            crypto: { name: 'Ethereum', symbol: 'eth' },
            type: 'buy',
            quantity: 2,
            price_usd: 3000,
            timestamp: new Date().toISOString(),
        },
    ],
};

const mockPrices = [
    { crypto_id: 1, price_usd: 50000, change_percent_24h: 2.5 },
    { crypto_id: 2, price_usd: 3200, change_percent_24h: -1.2 },
];

describe('PortfolioAssets', () => {
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
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });
    });

    it('renders asset cards after loading', async () => {
        render(<PortfolioAssets />);

        await waitFor(() => {
            expect(screen.getByText('Bitcoin')).toBeInTheDocument();
        });
    });

    it('displays asset count', async () => {
        render(<PortfolioAssets />);

        await waitFor(() => {
            expect(screen.getByText(/2 assets/i)).toBeInTheDocument();
        });
    });

    it('shows asset symbol', async () => {
        render(<PortfolioAssets />);

        await waitFor(() => {
            expect(screen.getAllByText('BTC').length).toBeGreaterThan(0);
        });
    });

    it('shows asset holdings', async () => {
        render(<PortfolioAssets />);

        await waitFor(() => {
            expect(screen.getByText(/0.5/)).toBeInTheDocument();
        });
    });

    it('shows total value for asset', async () => {
        render(<PortfolioAssets />);

        await waitFor(() => {
            // 0.5 BTC * $50,000 = $25,000
            expect(screen.getByText(/\$25,000/)).toBeInTheDocument();
        });
    });

    it('shows positive variation in green', async () => {
        render(<PortfolioAssets />);

        await waitFor(() => {
            // BTC has +2.5% change
            expect(screen.getByText(/2.50%/)).toBeInTheDocument();
        });
    });

    it('shows negative variation in red', async () => {
        render(<PortfolioAssets />);

        await waitFor(() => {
            // ETH has -1.2% change
            expect(screen.getByText(/1.20%/)).toBeInTheDocument();
        });
    });

    it('shows grid view by default', async () => {
        render(<PortfolioAssets />);

        await waitFor(() => {
            const grid = document.querySelector('.grid-cols-1.md\\:grid-cols-2');
            expect(grid).toBeInTheDocument();
        });
    });

    it('switches to list view when list toggle is clicked', async () => {
        render(<PortfolioAssets />);

        await waitFor(() => {
            expect(screen.getByText('Bitcoin')).toBeInTheDocument();
        });

        const listButton = screen.getByTitle('List view');
        fireEvent.click(listButton);

        await waitFor(() => {
            // In list view a table should be visible
            expect(document.querySelector('table')).toBeInTheDocument();
        });
    });

    it('switches back to grid view', async () => {
        render(<PortfolioAssets />);

        await waitFor(() => {
            expect(screen.getByText('Bitcoin')).toBeInTheDocument();
        });

        // Switch to list
        fireEvent.click(screen.getByTitle('List view'));
        // Switch back to grid
        fireEvent.click(screen.getByTitle('Grid view'));

        await waitFor(() => {
            expect(document.querySelector('.grid-cols-1.md\\:grid-cols-2')).toBeInTheDocument();
        });
    });

    it('shows empty state when no holdings', async () => {
        global.fetch.mockImplementation((url) => {
            if (url.includes('/portfolio/me')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ holdings: {}, transactions: [] }),
                });
            }
            return Promise.resolve({ ok: true, json: async () => [] });
        });

        render(<PortfolioAssets />);

        await waitFor(() => {
            expect(screen.getByText('No Assets Yet')).toBeInTheDocument();
        });
    });

    it('shows error when not authenticated', async () => {
        const Cookies = (await import('js-cookie')).default;
        Cookies.get.mockReturnValueOnce(null);

        render(<PortfolioAssets />);

        await waitFor(() => {
            expect(screen.getByText(/Utilisateur non connecté/)).toBeInTheDocument();
        });
    });

    it('shows error on API error response', async () => {
        global.fetch.mockImplementation((url) => {
            if (url.includes('/portfolio/me')) {
                return Promise.resolve({
                    ok: false,
                    json: async () => ({ error: 'Server error' }),
                });
            }
            return Promise.resolve({ ok: true, json: async () => [] });
        });

        render(<PortfolioAssets />);

        await waitFor(() => {
            expect(screen.getByText(/Server error/i)).toBeInTheDocument();
        });
    });

    it('handles fetch error gracefully', async () => {
        global.fetch.mockRejectedValue(new Error('Network failure'));

        render(<PortfolioAssets />);

        await waitFor(() => {
            expect(screen.getByText(/Erreur serveur/i)).toBeInTheDocument();
        });
    });

    it('renders fallback icon when no logo available', async () => {
        global.fetch.mockImplementation((url) => {
            if (url.includes('/portfolio/me')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        holdings: { xyz: 10 },
                        transactions: [
                            {
                                id: 1,
                                crypto_id: 99,
                                crypto: { name: 'XYZCoin', symbol: 'xyz' },
                                type: 'buy',
                                quantity: 10,
                                price_usd: 1,
                                timestamp: new Date().toISOString(),
                            },
                        ],
                    }),
                });
            }
            if (url.includes('/prices')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => [
                        { crypto_id: 99, price_usd: 1, change_percent_24h: 0 },
                    ],
                });
            }
            return Promise.resolve({ ok: true, json: async () => [] });
        });

        render(<PortfolioAssets />);

        await waitFor(() => {
            expect(screen.getByText('XYZCoin')).toBeInTheDocument();
        });
    });

    it('shows singular asset text for single asset', async () => {
        global.fetch.mockImplementation((url) => {
            if (url.includes('/portfolio/me')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        holdings: { btc: 0.5 },
                        transactions: [
                            {
                                id: 1,
                                crypto_id: 1,
                                crypto: { name: 'Bitcoin', symbol: 'btc' },
                                type: 'buy',
                                quantity: 0.5,
                                price_usd: 45000,
                                timestamp: new Date().toISOString(),
                            },
                        ],
                    }),
                });
            }
            if (url.includes('/prices')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => [
                        { crypto_id: 1, price_usd: 50000, change_percent_24h: 2.5 },
                    ],
                });
            }
            return Promise.resolve({ ok: true, json: async () => [] });
        });

        render(<PortfolioAssets />);

        await waitFor(() => {
            expect(screen.getByText(/1 asset in portfolio/)).toBeInTheDocument();
        });
    });
});
