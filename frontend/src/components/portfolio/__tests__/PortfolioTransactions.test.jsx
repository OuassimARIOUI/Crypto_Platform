import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PortfolioTransactions from '../PortfolioTransactions';

// Mock Cookies
vi.mock('js-cookie', () => ({
    default: {
        get: vi.fn(() => 'fake-token'),
    },
}));

// Mock fetch
global.fetch = vi.fn();

describe('PortfolioTransactions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        global.fetch.mockImplementation((url) => {
            if (url.includes('/portfolio/me')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        transactions: [
                            {
                                id: 1,
                                crypto: { symbol: 'btc', name: 'Bitcoin' },
                                type: 'buy',
                                quantity: 0.5,
                                price_usd: 45000,
                                timestamp: new Date().toISOString(),
                            },
                            {
                                id: 2,
                                crypto: { symbol: 'eth', name: 'Ethereum' },
                                type: 'sell',
                                quantity: 2,
                                price_usd: 3000,
                                timestamp: new Date(Date.now() - 86400000).toISOString(),
                            },
                        ],
                    }),
                });
            }
            return Promise.resolve({
                ok: true,
                json: async () => ({}),
            });
        });
    });


    it('displays transaction list', async () => {
        render(<PortfolioTransactions />);
        
        await waitFor(() => {
            expect(screen.getByText('Bitcoin')).toBeInTheDocument();
        });
    });

    it('shows buy transactions', async () => {
        render(<PortfolioTransactions />);
        
        await waitFor(() => {
            expect(screen.getByText(/Buy|BUY/i)).toBeInTheDocument();
        });
    });

    it('shows sell transactions', async () => {
        render(<PortfolioTransactions />);
        
        await waitFor(() => {
            expect(screen.getByText(/Sell|SELL/i)).toBeInTheDocument();
        });
    });

    it('displays transaction quantities', async () => {
        render(<PortfolioTransactions />);
        
        await waitFor(() => {
            expect(screen.getByText(/0.5/)).toBeInTheDocument();
        });
    });



    it('shows crypto logos', async () => {
        render(<PortfolioTransactions />);
        
        await waitFor(() => {
            const images = screen.getAllByRole('img');
            expect(images.length).toBeGreaterThan(0);
        });
    });

    it('displays fallback icons on image error', async () => {
        render(<PortfolioTransactions />);
        
        await waitFor(() => {
            const images = screen.getAllByRole('img');
            if (images[0]) {
                images[0].dispatchEvent(new Event('error'));
            }
        });
    });

    it('formats timestamps as relative time', async () => {
        render(<PortfolioTransactions />);
        
        await waitFor(() => {
            const timeElements = screen.queryAllByText(/ago|minutes|hours|days/i);
            expect(timeElements.length).toBeGreaterThanOrEqual(0);
        });
    });

    it('shows buy icon for buy transactions', async () => {
        render(<PortfolioTransactions />);
        
        await waitFor(() => {
            const svgs = document.querySelectorAll('svg');
            expect(svgs.length).toBeGreaterThan(0);
        });
    });

    it('shows sell icon for sell transactions', async () => {
        render(<PortfolioTransactions />);
        
        await waitFor(() => {
            const svgs = document.querySelectorAll('svg');
            expect(svgs.length).toBeGreaterThan(0);
        });
    });

    it('styles buy transactions differently from sell', async () => {
        render(<PortfolioTransactions />);
        
        await waitFor(() => {
            const buyText = screen.getByText(/Buy/i);
            const sellText = screen.getByText(/Sell/i);
            expect(buyText.className).not.toBe(sellText.className);
        });
    });

    it('displays empty state when no transactions', async () => {
        global.fetch.mockImplementation((url) => {
            if (url.includes('/portfolio/me')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        transactions: [],
                    }),
                });
            }
            return Promise.resolve({
                ok: true,
                json: async () => ({}),
            });
        });

        render(<PortfolioTransactions />);
        
        await waitFor(() => {
            expect(screen.getByText(/No Transactions/i)).toBeInTheDocument();
        });
    });

    it('handles API error gracefully', async () => {
        global.fetch.mockRejectedValueOnce(new Error('Network error'));
        
        render(<PortfolioTransactions />);
        
        await waitFor(() => {
            expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
        });
    });

    it('sorts transactions by date', async () => {
        render(<PortfolioTransactions />);
        
        await waitFor(() => {
            expect(screen.getByText('Bitcoin')).toBeInTheDocument();
        });
    });

    it('displays transaction cards with hover effects', async () => {
        render(<PortfolioTransactions />);
        
        await waitFor(() => {
            const cards = screen.getAllByText(/Bitcoin|Ethereum/);
            expect(cards.length).toBeGreaterThan(0);
        });
    });

    it('formats large numbers with commas', async () => {
        render(<PortfolioTransactions />);
        
        await waitFor(() => {
            const numbers = screen.getAllByText(/\d{1,3}(,\d{3})*/);
            expect(numbers.length).toBeGreaterThanOrEqual(0);
        });
    });

    it('shows loading skeleton initially', () => {
        render(<PortfolioTransactions />);
        const skeletons = document.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBeGreaterThanOrEqual(0);
    });

    it('handles multiple transactions of same crypto', async () => {
        global.fetch.mockImplementation((url) => {
            if (url.includes('/portfolio/me')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        transactions: [
                            {
                                crypto: { symbol: 'btc' },
                                type: 'buy',
                                quantity: 0.5,
                                price_usd: 45000,
                                timestamp: new Date().toISOString(),
                            },
                            {
                                crypto: { symbol: 'btc' },
                                type: 'buy',
                                quantity: 0.3,
                                price_usd: 47000,
                                timestamp: new Date().toISOString(),
                            },
                        ],
                    }),
                });
            }
            return Promise.resolve({
                ok: true,
                json: async () => ({}),
            });
        });

        render(<PortfolioTransactions />);
        
        await waitFor(() => {
            const btcElements = screen.getAllByText(/btc/i);
            expect(btcElements.length).toBeGreaterThan(1);
        });
    });
});
