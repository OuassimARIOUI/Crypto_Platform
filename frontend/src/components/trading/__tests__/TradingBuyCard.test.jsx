import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TradingBuyCard from '../TradingBuyCard';

// Mock Cookies
vi.mock('js-cookie', () => ({
    default: {
        get: vi.fn(() => 'fake-token'),
    },
}));

// Mock fetch
global.fetch = vi.fn();

describe('TradingBuyCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        global.fetch.mockImplementation((url) => {
            if (url.includes('/cryptos')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => [
                        { id: 1, symbol: 'btc', name: 'Bitcoin' },
                        { id: 2, symbol: 'eth', name: 'Ethereum' },
                    ],
                });
            }
            if (url.includes('/portfolio/me')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        balance: 10000,
                        holdings: { btc: 0.5, eth: 2 },
                        transactions: [],
                    }),
                });
            }
            if (url.includes('/prices')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => [
                        { crypto_id: 1, price_usd: 50000 },
                        { crypto_id: 2, price_usd: 3000 },
                    ],
                });
            }
            return Promise.resolve({
                ok: true,
                json: async () => ({ balance: 10000, holdings: {}, transactions: [] }),
            });
        });
    });

    it('renders buy form', async () => {
        render(<TradingBuyCard />);
        
        await waitFor(() => {
            expect(screen.getByText(/Buy/i)).toBeInTheDocument();
        });
    });

    it('displays crypto selector', async () => {
        render(<TradingBuyCard />);
        
        await waitFor(() => {
            const select = screen.getByRole('combobox');
            expect(select).toBeInTheDocument();
        });
    });



    it('shows current holdings', async () => {
        render(<TradingBuyCard />);
        
        await waitFor(() => {
            expect(screen.getByText(/0.5/)).toBeInTheDocument();
        });
    });




});
