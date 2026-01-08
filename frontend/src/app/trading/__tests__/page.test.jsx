import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock components
vi.mock('@/components/dashboard/DashboardLayout', () => ({
    default: ({ children }) => <div data-testid="dashboard-layout">{children}</div>,
}));

vi.mock('@/components/trading/TradingBuyCard', () => ({
    default: () => <div data-testid="trading-buy-card">TradingBuyCard</div>,
}));

vi.mock('@/components/trading/TradingSellCard', () => ({
    default: () => <div data-testid="trading-sell-card">TradingSellCard</div>,
}));

vi.mock('@/components/trading/TradingHeaderChart', () => ({
    default: () => <div data-testid="trading-header-chart">TradingHeaderChart</div>,
}));

import TradingPage from '../page';

describe('TradingPage', () => {
    it('renders within DashboardLayout', () => {
        render(<TradingPage />);
        expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    });

    it('renders Trading title', () => {
        render(<TradingPage />);
        expect(screen.getByText('Trading')).toBeInTheDocument();
    });

    it('renders subtitle', () => {
        render(<TradingPage />);
        expect(screen.getByText('Buy and sell cryptocurrencies instantly at market price')).toBeInTheDocument();
    });

    it('renders TradingHeaderChart component', () => {
        render(<TradingPage />);
        expect(screen.getByTestId('trading-header-chart')).toBeInTheDocument();
    });

    it('renders TradingBuyCard component', () => {
        render(<TradingPage />);
        expect(screen.getByTestId('trading-buy-card')).toBeInTheDocument();
    });

    it('renders TradingSellCard component', () => {
        render(<TradingPage />);
        expect(screen.getByTestId('trading-sell-card')).toBeInTheDocument();
    });

    it('renders Live Market indicator', () => {
        render(<TradingPage />);
        expect(screen.getByText('Live Market')).toBeInTheDocument();
    });

    it('renders Trading Tips section', () => {
        render(<TradingPage />);
        expect(screen.getByText('Trading Tips')).toBeInTheDocument();
    });
});
