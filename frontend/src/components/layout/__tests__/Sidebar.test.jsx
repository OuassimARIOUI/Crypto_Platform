"use client";
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
    usePathname: vi.fn(() => '/dashboard'),
}));

// Mock js-cookie
vi.mock('js-cookie', () => ({
    default: {
        get: vi.fn(() => 'test-token'),
        remove: vi.fn(),
    },
}));

// Mock firebase
vi.mock('@/lib/firebase', () => ({
    auth: {
        currentUser: { uid: 'test-uid' },
    },
    isFirebaseConfigured: true,
}));

// Mock firebase/auth
vi.mock('firebase/auth', () => ({
    signOut: vi.fn(() => Promise.resolve()),
}));

import Sidebar from '../Sidebar';
import { usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { signOut } from 'firebase/auth';

// Mock fetch
global.fetch = vi.fn();

describe('Sidebar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch.mockResolvedValue({
            json: () => Promise.resolve({ role: 'user' }),
        });
        delete window.location;
        window.location = { href: '' };
    });

    it('renders the sidebar with logo', () => {
        render(<Sidebar />);
        
        expect(screen.getByText('CryptoTrade')).toBeInTheDocument();
    });

    it('renders base menu items', () => {
        render(<Sidebar />);
        
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Portfolio')).toBeInTheDocument();
        expect(screen.getByText('Trading')).toBeInTheDocument();
        expect(screen.getByText('Indicators')).toBeInTheDocument();
        expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    it('shows Logout button', () => {
        render(<Sidebar />);
        
        expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('highlights current page', () => {
        usePathname.mockReturnValue('/dashboard');
        render(<Sidebar />);
        
        const dashboardLink = screen.getByText('Dashboard').closest('a');
        expect(dashboardLink).toHaveClass('bg-primary/20');
    });

    it('shows Users menu for admin', async () => {
        global.fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ role: 'admin' }),
        });

        render(<Sidebar />);

        await waitFor(() => {
            expect(screen.getByText('Users')).toBeInTheDocument();
        });
    });

    it('shows Users menu for moderator', async () => {
        global.fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ role: 'moderator' }),
        });

        render(<Sidebar />);

        await waitFor(() => {
            expect(screen.getByText('Users')).toBeInTheDocument();
        });
    });

    it('does not show Users menu for regular user', async () => {
        global.fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ role: 'user' }),
        });

        render(<Sidebar />);

        // Wait for the fetch to complete
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        });

        expect(screen.queryByText('Users')).not.toBeInTheDocument();
    });

    it('handles logout click', async () => {
        render(<Sidebar />);
        
        const logoutButton = screen.getByText('Logout');
        fireEvent.click(logoutButton);

        await waitFor(() => {
            expect(Cookies.remove).toHaveBeenCalledWith('token');
            expect(window.location.href).toBe('/login');
        });
    });

    it('handles logout with signOut', async () => {
        render(<Sidebar />);
        
        const logoutButton = screen.getByText('Logout');
        fireEvent.click(logoutButton);

        await waitFor(() => {
            expect(signOut).toHaveBeenCalled();
        });
    });

    it('handles API error gracefully', async () => {
        global.fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ error: 'Unauthorized' }),
        });

        render(<Sidebar />);

        // Should still render base menu
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('handles fetch error gracefully', async () => {
        global.fetch.mockRejectedValueOnce(new Error('Network error'));

        render(<Sidebar />);

        // Should still render base menu
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('does not fetch when no token', () => {
        Cookies.get.mockReturnValueOnce(null);
        render(<Sidebar />);

        expect(global.fetch).not.toHaveBeenCalled();
    });
});
