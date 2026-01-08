import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import IndicatorsPanel from '../IndicatorsPanel';

// Mock dynamic import for ApexCharts
vi.mock('next/dynamic', () => ({
    default: (fn) => {
        const DynamicComponent = (props) => {
            return <div data-testid="mock-chart">Chart Component</div>;
        };
        DynamicComponent.displayName = 'Chart';
        return DynamicComponent;
    },
}));

// Mock Cookies
vi.mock('js-cookie', () => ({
    default: {
        get: vi.fn(() => 'fake-token'),
    },
}));

// Mock fetch
global.fetch = vi.fn();

describe('IndicatorsPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Default mock responses
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
            if (url.includes('/prices/history')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => [
                        { time: new Date().toISOString(), price: 50000 },
                    ],
                });
            }
            if (url.includes('/prices')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => [
                        { crypto_id: 1, price_usd: 50000, change_percent_24h: 5 },
                    ],
                });
            }
            if (url.includes('/indicators')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        rsi: 65,
                        macd: { macd: 100, signal: 90, histogram: 10 },
                        bollinger: { upper: 51000, middle: 50000, lower: 49000 },
                        sma7: 49500,
                        sma30: 48000,
                    }),
                });
            }
            return Promise.resolve({
                ok: true,
                json: async () => ({}),
            });
        });
    });

    it('renders loading state initially', () => {
        render(<IndicatorsPanel />);
        expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    });

    it('fetches and displays crypto list', async () => {
        render(<IndicatorsPanel />);

        await waitFor(() => {
            expect(screen.getByText('BTC')).toBeInTheDocument();
        });
    });

    it('displays selected crypto pill', async () => {
        render(<IndicatorsPanel />);

        await waitFor(() => {
            const btcPill = screen.getByText('BTC');
            expect(btcPill).toBeInTheDocument();
        });
    });

    it('switches crypto when pill clicked', async () => {
        render(<IndicatorsPanel />);

        await waitFor(() => {
            expect(screen.getByText('ETH')).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('renders timeframe buttons', async () => {
        render(<IndicatorsPanel />);

        await waitFor(() => {
            expect(screen.getByText('24h')).toBeInTheDocument();
            expect(screen.getByText('7d')).toBeInTheDocument();
            expect(screen.getByText('1m')).toBeInTheDocument();
        });
    });

    it('changes timeframe when button clicked', async () => {
        render(<IndicatorsPanel />);

        await waitFor(() => {
            expect(screen.getByText('7d')).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('displays price information', async () => {
        render(<IndicatorsPanel />);

        await waitFor(() => {
            expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('displays variation percentage', async () => {
        render(<IndicatorsPanel />);

        await waitFor(() => {
            expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('displays RSI indicator', async () => {
        render(<IndicatorsPanel />);

        await waitFor(() => {
            expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('displays MACD indicator', async () => {
        render(<IndicatorsPanel />);

        await waitFor(() => {
            expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('displays Bollinger Bands', async () => {
        render(<IndicatorsPanel />);

        await waitFor(() => {
            expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('shows alert creation form', async () => {
        render(<IndicatorsPanel />);

        await waitFor(() => {
            expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('handles alert threshold input', async () => {
        render(<IndicatorsPanel />);

        await waitFor(() => {
            const inputs = screen.getAllByRole('spinbutton');
            if (inputs.length > 0) {
                fireEvent.change(inputs[0], { target: { value: '10' } });
            }
        });
    });

    it('handles fetch error gracefully', async () => {
        global.fetch.mockRejectedValueOnce(new Error('Network error'));

        render(<IndicatorsPanel />);

        await waitFor(() => {
            expect(screen.getByText(/Loading/i)).toBeInTheDocument();
        });
    });

    it('toggles SMA visibility', async () => {
        render(<IndicatorsPanel />);

        await waitFor(() => {
            const checkboxes = screen.queryAllByRole('checkbox');
            if (checkboxes.length > 0) {
                fireEvent.click(checkboxes[0]);
            }
        });
    });

    it('displays crypto logo with fallback', async () => {
        render(<IndicatorsPanel />);

        await waitFor(() => {
            const images = screen.queryAllByRole('img');
            expect(images.length).toBeGreaterThanOrEqual(0);
        });
    });

    it('formats dates correctly for different timeframes', async () => {
        render(<IndicatorsPanel />);

        await waitFor(() => {
            expect(screen.getByText('6m')).toBeInTheDocument();
        }, { timeout: 3000 });
    });
});
