import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock components
vi.mock('@/components/dashboard/DashboardLayout', () => ({
    default: ({ children }) => <div data-testid="dashboard-layout">{children}</div>,
}));

vi.mock('@/components/dashboard/TopCryptosTable', () => ({
    default: () => <div data-testid="top-cryptos-table">TopCryptosTable</div>,
}));

vi.mock('@/components/dashboard/DashboardStats', () => ({
    default: () => <div data-testid="dashboard-stats">DashboardStats</div>,
}));

import DashboardPage from '../page';

describe('DashboardPage', () => {
    it('renders within DashboardLayout', () => {
        render(<DashboardPage />);
        expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    });

    it('renders the Dashboard title', () => {
        render(<DashboardPage />);
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders subtitle', () => {
        render(<DashboardPage />);
        expect(screen.getByText('Your crypto market overview')).toBeInTheDocument();
    });

    it('renders DashboardStats component', () => {
        render(<DashboardPage />);
        expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
    });

    it('renders TopCryptosTable component', () => {
        render(<DashboardPage />);
        expect(screen.getByTestId('top-cryptos-table')).toBeInTheDocument();
    });

    it('renders Top 20 Cryptocurrencies section', () => {
        render(<DashboardPage />);
        expect(screen.getByText('Top 20 Cryptocurrencies')).toBeInTheDocument();
    });

    it('renders live market indicator', () => {
        render(<DashboardPage />);
        expect(screen.getByText('Live Market Data')).toBeInTheDocument();
    });

    it('renders market insights section', () => {
        render(<DashboardPage />);
        expect(screen.getByText('Market Insights')).toBeInTheDocument();
    });
});
