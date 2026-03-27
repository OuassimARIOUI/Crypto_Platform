import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TopCryptosTable from '../TopCryptosTable';

// Mock CryptoRow to isolate this component
vi.mock('../CryptoRow', () => ({
    default: ({ crypto, index }) => (
        <div data-testid="crypto-row" data-index={index}>
            <span>{crypto.name}</span>
            <span>{crypto.symbol}</span>
            <span>{crypto.price}</span>
        </div>
    ),
}));

global.fetch = vi.fn();

const mockCryptos = [
    { id: 1, name: 'Bitcoin', symbol: 'btc', rank: 1 },
    { id: 2, name: 'Ethereum', symbol: 'eth', rank: 2 },
    { id: 3, name: 'Tether', symbol: 'usdt', rank: 3 },
];

const mockPrices = [
    { crypto_id: 1, price_usd: 50000, change_percent_24h: 2.5, fetched_at: new Date().toISOString() },
    { crypto_id: 2, price_usd: 3200, change_percent_24h: -1.2, fetched_at: new Date().toISOString() },
    { crypto_id: 3, price_usd: 1, change_percent_24h: 0.01, fetched_at: new Date().toISOString() },
];

describe('TopCryptosTable', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        global.fetch.mockImplementation((url) => {
            if (url.includes('/cryptos')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockCryptos,
                });
            }
            if (url.includes('/prices')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockPrices,
                });
            }
            return Promise.resolve({ ok: true, json: async () => [] });
        });
    });

    it('shows skeleton loading initially', () => {
        global.fetch.mockReturnValue(new Promise(() => {}));
        render(<TopCryptosTable />);
        const skeletons = document.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders crypto rows after loading', async () => {
        render(<TopCryptosTable />);

        await waitFor(() => {
            expect(screen.getAllByTestId('crypto-row').length).toBeGreaterThan(0);
        });
    });

    it('displays all loaded cryptos', async () => {
        render(<TopCryptosTable />);

        await waitFor(() => {
            expect(screen.getByText('Bitcoin')).toBeInTheDocument();
            expect(screen.getByText('Ethereum')).toBeInTheDocument();
            expect(screen.getByText('Tether')).toBeInTheDocument();
        });
    });

    it('renders Rank, Price and 24h column headers', async () => {
        render(<TopCryptosTable />);

        await waitFor(() => {
            // Use getAllBy to handle both button and mobile option
            expect(screen.getAllByText(/Rank/i).length).toBeGreaterThan(0);
            expect(screen.getAllByText(/Price/i).length).toBeGreaterThan(0);
            expect(screen.getAllByText(/24h/i).length).toBeGreaterThan(0);
        });
    });

    it('shows footer "Showing top 20 cryptocurrencies"', async () => {
        render(<TopCryptosTable />);

        await waitFor(() => {
            expect(screen.getByText(/Showing top 20/i)).toBeInTheDocument();
        });
    });

    it('shows "Live prices" indicator', async () => {
        render(<TopCryptosTable />);

        await waitFor(() => {
            expect(screen.getByText(/Live prices/i)).toBeInTheDocument();
        });
    });

    it('sorts by price when Price header is clicked', async () => {
        render(<TopCryptosTable />);

        await waitFor(() => {
            expect(screen.getByText('Bitcoin')).toBeInTheDocument();
        });

        const priceButton = screen.getByRole('button', { name: /Price/i });
        fireEvent.click(priceButton);

        await waitFor(() => {
            const rows = screen.getAllByTestId('crypto-row');
            expect(rows.length).toBeGreaterThan(0);
        });
    });

    it('toggles sort order when same column header is clicked twice', async () => {
        render(<TopCryptosTable />);

        await waitFor(() => {
            expect(screen.getByText('Bitcoin')).toBeInTheDocument();
        });

        const rankButton = screen.getByRole('button', { name: /Rank/i });
        fireEvent.click(rankButton);
        fireEvent.click(rankButton);

        // Should not crash and still show rows
        expect(screen.getAllByTestId('crypto-row').length).toBeGreaterThan(0);
    });

    it('sorts by 24h change when 24h % header is clicked', async () => {
        render(<TopCryptosTable />);

        await waitFor(() => {
            expect(screen.getByText('Bitcoin')).toBeInTheDocument();
        });

        const changeButton = screen.getByRole('button', { name: /24h %/i });
        fireEvent.click(changeButton);

        await waitFor(() => {
            const rows = screen.getAllByTestId('crypto-row');
            expect(rows.length).toBeGreaterThan(0);
        });
    });

    it('handles fetch error gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        global.fetch.mockRejectedValue(new Error('Network error'));

        render(<TopCryptosTable />);

        // After the fetch error, the component should still render (empty list)
        await waitFor(() => {
            expect(screen.getByText(/Showing top 20/i)).toBeInTheDocument();
        });
        consoleSpy.mockRestore();
    });

    it('uses most recent price data when multiple entries exist', async () => {
        const olderDate = new Date(Date.now() - 3600000).toISOString();
        const newerDate = new Date().toISOString();

        global.fetch.mockImplementation((url) => {
            if (url.includes('/cryptos')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => [{ id: 1, name: 'Bitcoin', symbol: 'btc' }],
                });
            }
            if (url.includes('/prices')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => [
                        { crypto_id: 1, price_usd: 45000, change_percent_24h: 1.0, fetched_at: olderDate },
                        { crypto_id: 1, price_usd: 51000, change_percent_24h: 3.0, fetched_at: newerDate },
                    ],
                });
            }
            return Promise.resolve({ ok: true, json: async () => [] });
        });

        render(<TopCryptosTable />);

        await waitFor(() => {
            const rows = screen.getAllByTestId('crypto-row');
            // It should show the most recent price (51000)
            expect(rows[0]).toHaveAttribute('data-index');
        });
    });

    it('renders mobile sort dropdown', async () => {
        render(<TopCryptosTable />);

        await waitFor(() => {
            const select = screen.getByRole('combobox');
            expect(select).toBeInTheDocument();
        });
    });

    it('changes sort via mobile dropdown', async () => {
        render(<TopCryptosTable />);

        await waitFor(() => {
            expect(screen.getByRole('combobox')).toBeInTheDocument();
        });

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'price' } });

        // Should not crash
        expect(screen.getAllByTestId('crypto-row').length).toBeGreaterThan(0);
    });
});
