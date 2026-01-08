"use client";
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardStats from '../DashboardStats';

describe('DashboardStats', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('shows loading skeleton initially', () => {
        global.fetch.mockImplementation(() => new Promise(() => {})); // Never resolves
        const { container } = render(<DashboardStats />);
        expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('renders stats after loading', async () => {
        const mockData = [
            { name: 'Bitcoin', symbol: 'btc', price: 50000, change: 5 },
            { name: 'Ethereum', symbol: 'eth', price: 3000, change: -2 },
        ];

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockData),
        });

        render(<DashboardStats />);

        await waitFor(() => {
            expect(screen.getByText('Total Market Value')).toBeInTheDocument();
        });
    });


    it('displays average change', async () => {
        const mockData = [
            { name: 'Bitcoin', symbol: 'btc', price: 50000, change: 4 },
            { name: 'Ethereum', symbol: 'eth', price: 3000, change: 2 },
        ];

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockData),
        });

        render(<DashboardStats />);

        await waitFor(() => {
            expect(screen.getByText('Avg 24h Change')).toBeInTheDocument();
            expect(screen.getByText('+3.00%')).toBeInTheDocument();
        });
    });

    it('displays top gainer', async () => {
        const mockData = [
            { name: 'Bitcoin', symbol: 'btc', price: 50000, change: 10 },
            { name: 'Ethereum', symbol: 'eth', price: 3000, change: 2 },
        ];

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockData),
        });

        render(<DashboardStats />);

        await waitFor(() => {
            expect(screen.getByText('Top Gainer')).toBeInTheDocument();
            expect(screen.getByText('BTC')).toBeInTheDocument();
        });
    });

    it('displays crypto count', async () => {
        const mockData = [
            { name: 'Bitcoin', symbol: 'btc', price: 50000, change: 5 },
            { name: 'Ethereum', symbol: 'eth', price: 3000, change: -2 },
            { name: 'Solana', symbol: 'sol', price: 100, change: 8 },
        ];

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockData),
        });

        render(<DashboardStats />);

        await waitFor(() => {
            expect(screen.getByText('Total Cryptos')).toBeInTheDocument();
            expect(screen.getByText('3')).toBeInTheDocument();
        });
    });

    it('shows error message when no data', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve([]),
        });

        render(<DashboardStats />);

        await waitFor(() => {
            expect(screen.getByText('Unable to load market stats')).toBeInTheDocument();
        });
    });

    it('handles fetch error gracefully', async () => {
        global.fetch.mockRejectedValueOnce(new Error('Network error'));

        render(<DashboardStats />);

        await waitFor(() => {
            expect(screen.getByText('Unable to load market stats')).toBeInTheDocument();
        });
    });

    it('handles invalid price values', async () => {
        const mockData = [
            { name: 'Bitcoin', symbol: 'btc', price: 'invalid', change: 5 },
            { name: 'Ethereum', symbol: 'eth', price: null, change: 2 },
        ];

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockData),
        });

        render(<DashboardStats />);

        await waitFor(() => {
            expect(screen.getByText('Total Market Value')).toBeInTheDocument();
        });
    });

    it('handles negative average change', async () => {
        const mockData = [
            { name: 'Bitcoin', symbol: 'btc', price: 50000, change: -5 },
            { name: 'Ethereum', symbol: 'eth', price: 3000, change: -3 },
        ];

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockData),
        });

        render(<DashboardStats />);

        await waitFor(() => {
            expect(screen.getByText('-4.00%')).toBeInTheDocument();
        });
    });
});
