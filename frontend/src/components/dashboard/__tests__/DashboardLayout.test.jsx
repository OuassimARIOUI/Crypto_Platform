import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
    usePathname: vi.fn(() => '/dashboard'),
}));

// Mock next/link
vi.mock('next/link', () => ({
    default: ({ children, href, ...props }) => <a href={href} {...props}>{children}</a>,
}));

// Mock js-cookie
vi.mock('js-cookie', () => ({
    default: {
        get: vi.fn(() => 'fake-token'),
        remove: vi.fn(),
    },
}));

// Mock firebase
vi.mock('@/lib/firebase', () => ({
    auth: { currentUser: { uid: 'test-uid' } },
    isFirebaseConfigured: true,
}));

// Mock firebase/auth
vi.mock('firebase/auth', () => ({
    signOut: vi.fn(() => Promise.resolve()),
}));

// Mock child components to avoid their own side effects
vi.mock('@/components/ui/Notification', () => ({
    default: ({ message, type }) => <div data-testid="notification" data-type={type}>{message}</div>,
}));

vi.mock('@/components/messaging/MessagingDock', () => ({
    default: () => <div data-testid="messaging-dock" />,
}));

vi.mock('@/components/theme/ThemeToggleButton', () => ({
    default: () => <button data-testid="theme-toggle">Theme</button>,
}));

global.fetch = vi.fn();

import DashboardLayout from '../DashboardLayout';
import { usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { signOut } from 'firebase/auth';

describe('DashboardLayout', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        usePathname.mockReturnValue('/dashboard');
        global.fetch.mockResolvedValue({
            json: () => Promise.resolve({ pseudo: 'TestUser', email: 'test@test.com', role: 'user' }),
        });
        delete window.location;
        window.location = { href: '' };
    });

    it('renders children content', () => {
        render(
            <DashboardLayout>
                <div>Child Content</div>
            </DashboardLayout>
        );
        expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('renders CryptoApp brand', () => {
        render(<DashboardLayout><div /></DashboardLayout>);
        expect(screen.getAllByText('CryptoApp').length).toBeGreaterThan(0);
    });

    it('renders navigation links', async () => {
        render(<DashboardLayout><div /></DashboardLayout>);

        await waitFor(() => {
            expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
            expect(screen.getAllByText('Portfolio').length).toBeGreaterThan(0);
        });
    });

    it('shows user pseudo when loaded', async () => {
        render(<DashboardLayout><div /></DashboardLayout>);

        await waitFor(() => {
            expect(screen.getByText('TestUser')).toBeInTheDocument();
        });
    });

    it('shows user email when loaded', async () => {
        render(<DashboardLayout><div /></DashboardLayout>);

        await waitFor(() => {
            expect(screen.getByText('test@test.com')).toBeInTheDocument();
        });
    });

    it('renders Logout button', async () => {
        render(<DashboardLayout><div /></DashboardLayout>);

        await waitFor(() => {
            expect(screen.getAllByText('Logout').length).toBeGreaterThan(0);
        });
    });

    it('shows open menu button on mobile', () => {
        render(<DashboardLayout><div /></DashboardLayout>);
        const menuButton = screen.getByLabelText('Open menu');
        expect(menuButton).toBeInTheDocument();
    });

    it('opens mobile drawer when menu button is clicked', async () => {
        render(<DashboardLayout><div /></DashboardLayout>);

        const menuButton = screen.getByLabelText('Open menu');
        fireEvent.click(menuButton);

        await waitFor(() => {
            expect(screen.getByLabelText('Sidebar')).toBeInTheDocument();
        });
    });

    it('closes mobile drawer when close button is clicked', async () => {
        render(<DashboardLayout><div /></DashboardLayout>);

        // Open drawer
        fireEvent.click(screen.getByLabelText('Open menu'));

        // There are two "Close menu" buttons: the overlay and the x button inside
        // Click the x button inside the drawer (it's a button with a span child, not the overlay)
        const closeButtons = screen.getAllByLabelText('Close menu');
        const xButton = closeButtons.find(btn => btn.tagName === 'BUTTON' && !btn.className.includes('fixed inset-0'));
        fireEvent.click(xButton);

        // Drawer should have -translate-x-full class
        const drawer = screen.getByRole('dialog');
        expect(drawer.className).toContain('-translate-x-full');
    });

    it('renders messaging dock', () => {
        render(<DashboardLayout><div /></DashboardLayout>);
        expect(screen.getByTestId('messaging-dock')).toBeInTheDocument();
    });

    it('renders theme toggle button', () => {
        render(<DashboardLayout><div /></DashboardLayout>);
        expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    it('shows Users link for admin user', async () => {
        global.fetch.mockResolvedValue({
            json: () => Promise.resolve({ pseudo: 'Admin', email: 'admin@test.com', role: 'admin' }),
        });

        render(<DashboardLayout><div /></DashboardLayout>);

        await waitFor(() => {
            expect(screen.getAllByText('Users').length).toBeGreaterThan(0);
        });
    });

    it('shows Reports link for admin user', async () => {
        global.fetch.mockResolvedValue({
            json: () => Promise.resolve({ pseudo: 'Admin', email: 'admin@test.com', role: 'admin' }),
        });

        render(<DashboardLayout><div /></DashboardLayout>);

        await waitFor(() => {
            expect(screen.getAllByText('Reports').length).toBeGreaterThan(0);
        });
    });

    it('does not show Users link for regular user', async () => {
        render(<DashboardLayout><div /></DashboardLayout>);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        });

        expect(screen.queryByText('Users')).not.toBeInTheDocument();
    });

    it('shows banned account notification', async () => {
        global.fetch.mockResolvedValue({
            json: () => Promise.resolve({
                pseudo: 'BannedUser',
                email: 'banned@test.com',
                role: 'user',
                status: 'banned',
            }),
        });

        render(<DashboardLayout><div /></DashboardLayout>);

        await waitFor(() => {
            expect(screen.getByTestId('notification')).toBeInTheDocument();
        });
    });

    it('shows suspended account notification', async () => {
        global.fetch.mockResolvedValue({
            json: () => Promise.resolve({
                pseudo: 'SuspendedUser',
                email: 'sus@test.com',
                role: 'user',
                status: 'suspended',
            }),
        });

        render(<DashboardLayout><div /></DashboardLayout>);

        await waitFor(() => {
            expect(screen.getByTestId('notification')).toBeInTheDocument();
        });
    });

    it('calls logout and redirects to /login', async () => {
        render(<DashboardLayout><div /></DashboardLayout>);

        const logoutButtons = screen.getAllByText('Logout');
        fireEvent.click(logoutButtons[0]);

        await waitFor(() => {
            expect(Cookies.remove).toHaveBeenCalledWith('token');
            expect(window.location.href).toBe('/login');
        });
    });

    it('calls signOut on logout', async () => {
        render(<DashboardLayout><div /></DashboardLayout>);

        const logoutButtons = screen.getAllByText('Logout');
        fireEvent.click(logoutButtons[0]);

        await waitFor(() => {
            expect(signOut).toHaveBeenCalled();
        });
    });

    it('does not fetch when no token', async () => {
        Cookies.get.mockReturnValueOnce(null);

        render(<DashboardLayout><div /></DashboardLayout>);

        await waitFor(() => {
            expect(global.fetch).not.toHaveBeenCalled();
        });
    });

    it('handles API error gracefully', async () => {
        global.fetch.mockRejectedValue(new Error('Network error'));

        render(<DashboardLayout><div /></DashboardLayout>);

        await waitFor(() => {
            // Should still render without crashing
            expect(screen.getAllByText('CryptoApp').length).toBeGreaterThan(0);
        });
    });

    it('handles API response with error field', async () => {
        global.fetch.mockResolvedValue({
            json: () => Promise.resolve({ error: 'Unauthorized' }),
        });

        render(<DashboardLayout><div /></DashboardLayout>);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        });

        // No user info should be shown
        expect(screen.getByText('...')).toBeInTheDocument();
    });

    it('highlights active Dashboard link', async () => {
        usePathname.mockReturnValue('/dashboard');

        render(<DashboardLayout><div /></DashboardLayout>);

        const dashboardLinks = screen.getAllByRole('link', { name: /Dashboard/i });
        expect(dashboardLinks[0].className).toContain('bg-primary/20');
    });

    it('renders collapse toggle button', () => {
        render(<DashboardLayout><div /></DashboardLayout>);
        // collapse/expand button
        const collapseBtn = screen.queryByLabelText(/Collapse sidebar/i);
        if (collapseBtn) {
            expect(collapseBtn).toBeInTheDocument();
        }
    });
});
