import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock components
vi.mock('@/components/dashboard/DashboardLayout', () => ({
    default: ({ children }) => <div data-testid="dashboard-layout">{children}</div>,
}));

vi.mock('@/components/portfolio/PortfolioStats', () => ({
    default: () => <div data-testid="portfolio-stats">PortfolioStats</div>,
}));

vi.mock('@/components/portfolio/PortfolioAssets', () => ({
    default: () => <div data-testid="portfolio-assets">PortfolioAssets</div>,
}));

vi.mock('@/components/portfolio/PortfolioTransactions', () => ({
    default: () => <div data-testid="portfolio-transactions">PortfolioTransactions</div>,
}));

vi.mock('@/components/portfolio/TransferFunds', () => ({
    default: () => <div data-testid="transfer-funds">TransferFunds</div>,
}));

import PortfolioPage from '../page';

describe('PortfolioPage', () => {
    it('renders within DashboardLayout', () => {
        render(<PortfolioPage />);
        expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    });

    it('renders Portfolio title', () => {
        render(<PortfolioPage />);
        expect(screen.getByText('Portfolio')).toBeInTheDocument();
    });

    it('renders subtitle', () => {
        render(<PortfolioPage />);
        expect(screen.getByText('Track your crypto investments and manage your assets')).toBeInTheDocument();
    });

    it('renders PortfolioStats component', () => {
        render(<PortfolioPage />);
        expect(screen.getByTestId('portfolio-stats')).toBeInTheDocument();
    });

    it('renders PortfolioAssets component', () => {
        render(<PortfolioPage />);
        expect(screen.getByTestId('portfolio-assets')).toBeInTheDocument();
    });

    it('renders PortfolioTransactions component', () => {
        render(<PortfolioPage />);
        expect(screen.getByTestId('portfolio-transactions')).toBeInTheDocument();
    });

    it('renders TransferFunds component', () => {
        render(<PortfolioPage />);
        expect(screen.getByTestId('transfer-funds')).toBeInTheDocument();
    });

    it('renders My Assets section title', () => {
        render(<PortfolioPage />);
        expect(screen.getByText('My Assets')).toBeInTheDocument();
    });

    it('renders Recent Activity section title', () => {
        render(<PortfolioPage />);
        expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });
});
