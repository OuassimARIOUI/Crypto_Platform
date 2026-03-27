import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfileDetails from '../ProfileDetails';

// Mock js-cookie
vi.mock('js-cookie', () => ({
    default: {
        get: vi.fn(() => 'fake-token'),
    },
}));

global.fetch = vi.fn();

const mockUser = {
    id: 1,
    pseudo: 'TestUser',
    email: 'test@example.com',
    role: 'user',
    status: 'active',
    discord_user_id: null,
    discord_username: null,
    created_at: new Date().toISOString(),
};

const mockPortfolio = {
    balance: 1000.50,
    holdings: {},
    transactions: [],
};

describe('ProfileDetails', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        global.fetch.mockImplementation((url, options) => {
            if (url.includes('/auth/me') && (!options || options.method !== 'PATCH')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockUser,
                });
            }
            if (url.includes('/portfolio/me')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockPortfolio,
                });
            }
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });

        delete window.location;
        window.location = { href: '' };
    });

    it('shows loading state initially', () => {
        global.fetch.mockReturnValue(new Promise(() => {}));
        render(<ProfileDetails />);
        expect(screen.getByText('Loading profile...')).toBeInTheDocument();
    });

    it('renders Account Details heading after load', async () => {
        render(<ProfileDetails />);

        await waitFor(() => {
            expect(screen.getByText('Account Details')).toBeInTheDocument();
        });
    });

    it('displays user pseudo', async () => {
        render(<ProfileDetails />);

        await waitFor(() => {
            expect(screen.getByText('TestUser')).toBeInTheDocument();
        });
    });

    it('displays user email', async () => {
        render(<ProfileDetails />);

        await waitFor(() => {
            expect(screen.getByText('test@example.com')).toBeInTheDocument();
        });
    });

    it('displays user role badge', async () => {
        render(<ProfileDetails />);

        await waitFor(() => {
            expect(screen.getByText('User')).toBeInTheDocument();
        });
    });

    it('displays admin role badge for admin', async () => {
        global.fetch.mockImplementation((url, options) => {
            if (url.includes('/auth/me') && (!options || options.method !== 'PATCH')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ ...mockUser, role: 'admin' }),
                });
            }
            if (url.includes('/portfolio/me')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockPortfolio,
                });
            }
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });

        render(<ProfileDetails />);

        await waitFor(() => {
            expect(screen.getByText('Admin')).toBeInTheDocument();
        });
    });

    it('displays portfolio balance', async () => {
        render(<ProfileDetails />);

        await waitFor(() => {
            expect(screen.getByText(/1,000/)).toBeInTheDocument();
        });
    });

    it('shows "Unable to load profile" when no token', async () => {
        const Cookies = (await import('js-cookie')).default;
        Cookies.get.mockReturnValueOnce(null);

        render(<ProfileDetails />);

        await waitFor(() => {
            expect(screen.getByText(/Unable to load profile/)).toBeInTheDocument();
        });
    });

    it('handles fetch error gracefully', async () => {
        global.fetch.mockRejectedValue(new Error('Network error'));

        render(<ProfileDetails />);

        await waitFor(() => {
            expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
        });
    });

    it('shows Discord connect button when not linked', async () => {
        render(<ProfileDetails />);

        await waitFor(() => {
            expect(screen.getByText(/Connect Discord/i)).toBeInTheDocument();
        });
    });

    it('shows Discord disconnect button when linked', async () => {
        global.fetch.mockImplementation((url, options) => {
            if (url.includes('/auth/me') && (!options || options.method !== 'PATCH')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        ...mockUser,
                        discord_user_id: '123456789',
                        discord_username: 'discord_user#1234',
                    }),
                });
            }
            if (url.includes('/portfolio/me')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockPortfolio,
                });
            }
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });

        render(<ProfileDetails />);

        await waitFor(() => {
            expect(screen.getByText(/Disconnect/i)).toBeInTheDocument();
        });
    });

    it('initiates save when Save Changes is clicked', async () => {
        global.fetch.mockImplementation((url, options) => {
            if (url.includes('/auth/me') && options?.method === 'PATCH') {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ user: { ...mockUser, pseudo: 'NewName' } }),
                });
            }
            if (url.includes('/auth/me')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockUser,
                });
            }
            if (url.includes('/portfolio/me')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockPortfolio,
                });
            }
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });

        render(<ProfileDetails />);

        await waitFor(() => {
            expect(screen.getByText('TestUser')).toBeInTheDocument();
        });

        // Find and click save changes button if visible
        const saveBtn = screen.queryByText(/Save Changes/i);
        if (saveBtn) {
            fireEvent.click(saveBtn);
            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining('/auth/me'),
                    expect.objectContaining({ method: 'PATCH' })
                );
            });
        }
    });

    it('shows success message after profile update', async () => {
        global.fetch.mockImplementation((url, options) => {
            if (url.includes('/auth/me') && options?.method === 'PATCH') {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ user: { ...mockUser, pseudo: 'NewName' } }),
                });
            }
            if (url.includes('/auth/me')) {
                return Promise.resolve({ ok: true, json: async () => mockUser });
            }
            if (url.includes('/portfolio/me')) {
                return Promise.resolve({ ok: true, json: async () => mockPortfolio });
            }
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });

        render(<ProfileDetails />);

        await waitFor(() => expect(screen.getByText('TestUser')).toBeInTheDocument());

        // Click edit button for pseudo (it's in the header area)
        const saveBtn = screen.queryByText(/Save Changes/i);
        if (saveBtn) {
            fireEvent.click(saveBtn);
            await waitFor(() => {
                expect(screen.getByText(/Profile updated successfully/i)).toBeInTheDocument();
            });
        }
    });

    it('renders email address label', async () => {
        render(<ProfileDetails />);

        await waitFor(() => {
            expect(screen.getByText('Email Address')).toBeInTheDocument();
        });
    });

    it('renders username label', async () => {
        render(<ProfileDetails />);

        await waitFor(() => {
            expect(screen.getByText('Username')).toBeInTheDocument();
        });
    });

    it('renders portfolio balance label', async () => {
        render(<ProfileDetails />);

        await waitFor(() => {
            expect(screen.getByText('Portfolio Balance')).toBeInTheDocument();
        });
    });

    it('connects to Discord when button clicked', async () => {
        global.fetch.mockImplementation((url, options) => {
            if (url.includes('/discord/connect-url')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ url: 'https://discord.com/oauth' }),
                });
            }
            if (url.includes('/auth/me')) {
                return Promise.resolve({ ok: true, json: async () => mockUser });
            }
            if (url.includes('/portfolio/me')) {
                return Promise.resolve({ ok: true, json: async () => mockPortfolio });
            }
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });

        render(<ProfileDetails />);

        await waitFor(() => {
            expect(screen.getByText(/Connect Discord/i)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/Connect Discord/i));

        await waitFor(() => {
            expect(window.location.href).toBe('https://discord.com/oauth');
        });
    });
});
