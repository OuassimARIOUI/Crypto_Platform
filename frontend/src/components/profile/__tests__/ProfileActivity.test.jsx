import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfileActivity from '../ProfileActivity';

// Mock js-cookie
vi.mock('js-cookie', () => ({
    default: {
        get: vi.fn(() => 'fake-token'),
    },
}));

global.fetch = vi.fn();

describe('ProfileActivity', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows loading state initially', () => {
        global.fetch.mockReturnValue(new Promise(() => {}));
        render(<ProfileActivity />);
        expect(screen.getByText('Chargement…')).toBeInTheDocument();
    });

    it('renders Recent Activity heading after load', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ transactions: [] }),
        });

        render(<ProfileActivity />);

        await waitFor(() => {
            expect(screen.getByText('Recent Activity')).toBeInTheDocument();
        });
    });

    it('shows empty message when no transactions', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ transactions: [] }),
        });

        render(<ProfileActivity />);

        await waitFor(() => {
            expect(screen.getByText('Aucune transaction.')).toBeInTheDocument();
        });
    });

    it('displays transactions when data is returned', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                transactions: [
                    {
                        id: 1,
                        type: 'buy',
                        crypto: { symbol: 'BTC' },
                        quantity: 0.5,
                        price_usd: 45000,
                        timestamp: new Date().toISOString(),
                    },
                ],
            }),
        });

        render(<ProfileActivity />);

        await waitFor(() => {
            expect(screen.getByText('BUY')).toBeInTheDocument();
        });
    });

    it('shows crypto symbol and quantity', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                transactions: [
                    {
                        id: 1,
                        type: 'sell',
                        crypto: { symbol: 'ETH' },
                        quantity: 2,
                        price_usd: 3000,
                        timestamp: new Date().toISOString(),
                    },
                ],
            }),
        });

        render(<ProfileActivity />);

        await waitFor(() => {
            expect(screen.getByText(/ETH/)).toBeInTheDocument();
        });
    });

    it('limits displayed transactions to 10', async () => {
        const manyTransactions = Array.from({ length: 15 }, (_, i) => ({
            id: i + 1,
            type: 'buy',
            crypto: { symbol: 'BTC' },
            quantity: 0.1,
            price_usd: 50000,
            timestamp: new Date().toISOString(),
        }));

        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ transactions: manyTransactions }),
        });

        render(<ProfileActivity />);

        await waitFor(() => {
            const rows = document.querySelectorAll('.grid.grid-cols-12');
            expect(rows.length).toBeLessThanOrEqual(10);
        });
    });

    it('shows no loading text after data is loaded', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ transactions: [] }),
        });

        render(<ProfileActivity />);

        await waitFor(() => {
            expect(screen.queryByText('Chargement…')).not.toBeInTheDocument();
        });
    });

    it('handles API error gracefully', async () => {
        global.fetch.mockRejectedValue(new Error('Network error'));

        render(<ProfileActivity />);

        await waitFor(() => {
            expect(screen.queryByText('Chargement…')).not.toBeInTheDocument();
        });
    });

    it('handles non-ok response gracefully', async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            json: async () => ({ error: 'Unauthorized' }),
        });

        render(<ProfileActivity />);

        await waitFor(() => {
            expect(screen.queryByText('Chargement…')).not.toBeInTheDocument();
        });
    });

    it('does not call fetch when no token', async () => {
        const Cookies = (await import('js-cookie')).default;
        Cookies.get.mockReturnValueOnce(null);

        render(<ProfileActivity />);

        await waitFor(() => {
            expect(global.fetch).not.toHaveBeenCalled();
        });
    });

    it('formats transaction price as USD', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                transactions: [
                    {
                        id: 1,
                        type: 'buy',
                        crypto: { symbol: 'BTC' },
                        quantity: 1,
                        price_usd: 50000,
                        timestamp: new Date().toISOString(),
                    },
                ],
            }),
        });

        render(<ProfileActivity />);

        await waitFor(() => {
            expect(screen.getByText(/\$50,000/)).toBeInTheDocument();
        });
    });
});
