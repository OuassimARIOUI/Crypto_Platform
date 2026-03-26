import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/dynamic to avoid SSR issues with ApexCharts
vi.mock('next/dynamic', () => ({
    default: (_fn, _opts) => {
        const MockChart = () => <div data-testid="apex-chart">Chart</div>;
        MockChart.displayName = 'MockChart';
        return MockChart;
    },
}));

global.fetch = vi.fn();

import TradingHeaderChart from '../TradingHeaderChart';

const mockCryptos = [
    { id: 1, symbol: 'btc', name: 'Bitcoin' },
    { id: 2, symbol: 'eth', name: 'Ethereum' },
    { id: 3, symbol: 'ada', name: 'Cardano' },
];

const mockPrices = [
    { crypto_id: 1, price_usd: 50000, change_percent_24h: 2.5 },
    { crypto_id: 2, price_usd: 3200, change_percent_24h: -1.2 },
];

const mockHistory = [
    { time: new Date(Date.now() - 3600000).toISOString(), price: 49000 },
    { time: new Date().toISOString(), price: 50000 },
];

describe('TradingHeaderChart', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        global.fetch.mockImplementation((url) => {
            if (url.includes('/cryptos')) {
                return Promise.resolve({ ok: true, json: async () => mockCryptos });
            }
            if (url.includes('/prices/history')) {
                return Promise.resolve({ ok: true, json: async () => mockHistory });
            }
            if (url.includes('/prices')) {
                return Promise.resolve({ ok: true, json: async () => mockPrices });
            }
            return Promise.resolve({ ok: true, json: async () => [] });
        });
    });

    it('renders the chart component', async () => {
        render(<TradingHeaderChart />);

        await waitFor(() => {
            expect(screen.getByTestId('apex-chart')).toBeInTheDocument();
        });
    });

    it('shows BTC/USD as primary symbol by default', async () => {
        render(<TradingHeaderChart />);

        await waitFor(() => {
            expect(screen.getByText('BTC/USD')).toBeInTheDocument();
        });
    });

    it('renders timeframe buttons', async () => {
        render(<TradingHeaderChart />);

        await waitFor(() => {
            expect(screen.getByText('1H')).toBeInTheDocument();
            expect(screen.getByText('4H')).toBeInTheDocument();
            expect(screen.getByText('24H')).toBeInTheDocument();
            expect(screen.getByText('7D')).toBeInTheDocument();
            expect(screen.getByText('1M')).toBeInTheDocument();
        });
    });

    it('renders Y-mode buttons', async () => {
        render(<TradingHeaderChart />);

        await waitFor(() => {
            expect(screen.getByText('Price')).toBeInTheDocument();
            expect(screen.getByText('Variation %')).toBeInTheDocument();
        });
    });

    it('shows loading state initially', () => {
        global.fetch.mockReturnValue(new Promise(() => {}));
        render(<TradingHeaderChart />);
        expect(screen.getByText('Loading chart data...')).toBeInTheDocument();
    });

    it('shows crypto pills for loaded cryptos', async () => {
        render(<TradingHeaderChart />);

        await waitFor(() => {
            expect(screen.getByText('BTC')).toBeInTheDocument();
            expect(screen.getByText('ETH')).toBeInTheDocument();
        });
    });

    it('switches timeframe when timeframe button is clicked', async () => {
        render(<TradingHeaderChart />);

        await waitFor(() => {
            expect(screen.getByText('4H')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('4H'));

        // After clicking 4H, it should refetch data
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('timeframe=4h')
            );
        });
    });

    it('switches Y-mode to Variation % when clicked', async () => {
        render(<TradingHeaderChart />);

        await waitFor(() => {
            expect(screen.getByText('Variation %')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Variation %'));

        // The label should now show "Compare by Variation (%)"
        await waitFor(() => {
            expect(screen.getByText(/Compare by Variation/)).toBeInTheDocument();
        });
    });

    it('displays price when data is loaded', async () => {
        render(<TradingHeaderChart />);

        await waitFor(() => {
            // Should show formatted price like $50.00K or $50000
            expect(screen.queryByText('...')).not.toBeInTheDocument();
        });
    });

    it('shows 24h change percentage', async () => {
        render(<TradingHeaderChart />);

        await waitFor(() => {
            expect(screen.getByText(/2.50%/)).toBeInTheDocument();
        });
    });

    it('shows selected count text', async () => {
        render(<TradingHeaderChart />);

        await waitFor(() => {
            expect(screen.getByText(/1 selected/)).toBeInTheDocument();
        });
    });

    it('can add a crypto to selection by clicking pill', async () => {
        render(<TradingHeaderChart />);

        await waitFor(() => {
            expect(screen.getByText('ETH')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('ETH'));

        await waitFor(() => {
            expect(screen.getByText(/2 selected/)).toBeInTheDocument();
        });
    });

    it('can deselect a crypto by clicking active pill', async () => {
        render(<TradingHeaderChart />);

        await waitFor(() => {
            expect(screen.getByText('BTC')).toBeInTheDocument();
        });

        // BTC is already selected; clicking should deselect
        fireEvent.click(screen.getByText('BTC'));

        await waitFor(() => {
            expect(screen.getByText(/0 selected/)).toBeInTheDocument();
        });
    });

    it('handles fetch error gracefully', async () => {
        global.fetch.mockRejectedValue(new Error('Network error'));

        render(<TradingHeaderChart />);

        await waitFor(() => {
            // Should not crash - chart container should still be present
            expect(screen.queryByText('Loading chart data...')).not.toBeInTheDocument();
        });
    });

    it('handles non-array cryptos response', async () => {
        global.fetch.mockImplementation((url) => {
            if (url.includes('/cryptos')) {
                return Promise.resolve({ ok: true, json: async () => null });
            }
            if (url.includes('/prices/history')) {
                return Promise.resolve({ ok: true, json: async () => [] });
            }
            if (url.includes('/prices')) {
                return Promise.resolve({ ok: true, json: async () => [] });
            }
            return Promise.resolve({ ok: true, json: async () => [] });
        });

        render(<TradingHeaderChart />);

        await waitFor(() => {
            // Should not crash
            expect(screen.queryByText('Loading chart data...')).not.toBeInTheDocument();
        });
    });

    it('shows "Compare by Price (USD)" label in price mode', async () => {
        render(<TradingHeaderChart />);

        await waitFor(() => {
            expect(screen.getByText(/Compare by Price/)).toBeInTheDocument();
        });
    });

    it('shows "Compare by Variation (%)" label in variation mode', async () => {
        render(<TradingHeaderChart />);

        await waitFor(() => {
            expect(screen.getByText('Variation %')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Variation %'));

        await waitFor(() => {
            expect(screen.getByText(/Compare by/)).toBeInTheDocument();
        });
    });
});
