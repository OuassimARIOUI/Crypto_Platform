import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock components
vi.mock('@/components/dashboard/DashboardLayout', () => ({
    default: ({ children }) => <div data-testid="dashboard-layout">{children}</div>,
}));

vi.mock('@/components/indicators/IndicatorsPanel', () => ({
    default: () => <div data-testid="indicators-panel">IndicatorsPanel</div>,
}));

import IndicatorsPage from '../page';

describe('IndicatorsPage', () => {
    it('renders within DashboardLayout', () => {
        render(<IndicatorsPage />);
        expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    });

    it('renders Technical Indicators title', () => {
        render(<IndicatorsPage />);
        expect(screen.getByText('Technical Indicators')).toBeInTheDocument();
    });

    it('renders subtitle', () => {
        render(<IndicatorsPage />);
        expect(screen.getByText('Analyze market trends with advanced overlays')).toBeInTheDocument();
    });

    it('renders IndicatorsPanel component', () => {
        render(<IndicatorsPage />);
        expect(screen.getByTestId('indicators-panel')).toBeInTheDocument();
    });

    it('renders SMA badges', () => {
        render(<IndicatorsPage />);
        expect(screen.getByText('SMA 7')).toBeInTheDocument();
        expect(screen.getByText('SMA 30')).toBeInTheDocument();
    });

    it('renders Alerts badge', () => {
        render(<IndicatorsPage />);
        expect(screen.getByText('Alerts')).toBeInTheDocument();
    });

    it('renders Pro Tips section', () => {
        render(<IndicatorsPage />);
        expect(screen.getByText('Pro Tips')).toBeInTheDocument();
    });
});
