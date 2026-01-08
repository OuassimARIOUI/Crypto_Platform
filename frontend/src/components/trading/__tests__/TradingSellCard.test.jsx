import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TradingSellCard from '../TradingSellCard';

// Mock Cookies
vi.mock('js-cookie', () => ({
    default: {
        get: vi.fn(() => 'fake-token'),
    },
}));

// Mock fetch
global.fetch = vi.fn();

describe('TradingSellCard', () => {
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
                        holdings: { btc: 0.5, eth: 2 },
                        balance: 10000,
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
                json: async () => ({ holdings: {}, balance: 10000, transactions: [] }),
            });
        });
    });



    it('displays crypto selector', async () => {
        render(<TradingSellCard />);
        
        await waitFor(() => {
            const select = screen.getByRole('combobox');
            expect(select).toBeInTheDocument();
        });
    });

    it('displays current holdings', async () => {
        render(<TradingSellCard />);
        
        await waitFor(() => {
            expect(screen.getByText(/0.5/)).toBeInTheDocument();
        });
    });

    it('displays current price', async () => {
        render(<TradingSellCard />);
        
        await waitFor(() => {
            expect(screen.getByText(/50000/)).toBeInTheDocument();
        });
    });



    it('shows quick percentage buttons', async () => {
        render(<TradingSellCard />);
        
        await waitFor(() => {
            expect(screen.getByText(/25%/)).toBeInTheDocument();
            expect(screen.getByText(/50%/)).toBeInTheDocument();
            expect(screen.getByText(/75%/)).toBeInTheDocument();
            expect(screen.getByText(/100%/)).toBeInTheDocument();
        });
    });




});
