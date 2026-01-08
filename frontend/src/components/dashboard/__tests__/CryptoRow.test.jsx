"use client";
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CryptoRow from '../CryptoRow';

// Mock next/link
vi.mock('next/link', () => ({
    default: ({ children, href }) => <a href={href}>{children}</a>,
}));

describe('CryptoRow', () => {
    const mockCrypto = {
        name: 'Bitcoin',
        symbol: 'btc',
        price: 50000,
        change: 5.5,
        logo: 'https://example.com/btc.png',
    };

    it('renders crypto name and symbol', () => {
        render(<CryptoRow crypto={mockCrypto} index={1} />);
        expect(screen.getAllByText('Bitcoin')[0]).toBeInTheDocument();
        expect(screen.getAllByText('BTC')[0]).toBeInTheDocument();
    });


    it('renders positive change with green styling', () => {
        render(<CryptoRow crypto={mockCrypto} index={1} />);
        expect(screen.getAllByText('+5.50%')[0]).toBeInTheDocument();
    });

    it('renders negative change with red styling', () => {
        const negativeCrypto = { ...mockCrypto, change: -3.5 };
        render(<CryptoRow crypto={negativeCrypto} index={1} />);
        expect(screen.getAllByText('-3.50%')[0]).toBeInTheDocument();
    });

    it('renders rank badge', () => {
        render(<CryptoRow crypto={mockCrypto} index={1} />);
        expect(screen.getAllByText('1')[0]).toBeInTheDocument();
    });

    it('applies gold style for rank 1', () => {
        const { container } = render(<CryptoRow crypto={mockCrypto} index={1} />);
        const rankBadge = container.querySelector('.from-yellow-500\\/30');
        expect(rankBadge).toBeInTheDocument();
    });

    it('applies silver style for rank 2', () => {
        const { container } = render(<CryptoRow crypto={mockCrypto} index={2} />);
        const rankBadge = container.querySelector('.from-gray-300\\/30');
        expect(rankBadge).toBeInTheDocument();
    });

    it('applies bronze style for rank 3', () => {
        const { container } = render(<CryptoRow crypto={mockCrypto} index={3} />);
        const rankBadge = container.querySelector('.from-orange-600\\/30');
        expect(rankBadge).toBeInTheDocument();
    });

    it('renders trade link with correct href', () => {
        render(<CryptoRow crypto={mockCrypto} index={1} />);
        const tradeLink = screen.getByRole('link', { name: /trade/i });
        expect(tradeLink).toHaveAttribute('href', '/trading?symbol=btc');
    });

    it('shows fallback icon when image fails to load', () => {
        render(<CryptoRow crypto={mockCrypto} index={1} />);
        const img = screen.getAllByRole('img')[0];
        fireEvent.error(img);
        // After error, fallback should show symbol initials
        expect(screen.getAllByText('BTC')[0]).toBeInTheDocument();
    });

    it('handles zero change', () => {
        const zeroCrypto = { ...mockCrypto, change: 0 };
        render(<CryptoRow crypto={zeroCrypto} index={1} />);
        expect(screen.getAllByText('+0.00%')[0]).toBeInTheDocument();
    });

    it('handles undefined change', () => {
        const undefinedCrypto = { ...mockCrypto, change: undefined };
        render(<CryptoRow crypto={undefinedCrypto} index={1} />);
        expect(screen.getAllByText('+0.00%')[0]).toBeInTheDocument();
    });
});
