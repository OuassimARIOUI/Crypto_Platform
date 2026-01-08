import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock components
vi.mock('@/components/dashboard/DashboardLayout', () => ({
    default: ({ children }) => <div data-testid="dashboard-layout">{children}</div>,
}));

vi.mock('@/components/profile/ProfileDetails', () => ({
    default: () => <div data-testid="profile-details">ProfileDetails</div>,
}));

import ProfilePage from '../page';

describe('ProfilePage', () => {
    it('renders within DashboardLayout', () => {
        render(<ProfilePage />);
        expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    });

    it('renders User Profile title', () => {
        render(<ProfilePage />);
        expect(screen.getByText('User Profile')).toBeInTheDocument();
    });

    it('renders ProfileDetails component', () => {
        render(<ProfilePage />);
        expect(screen.getByTestId('profile-details')).toBeInTheDocument();
    });
});
