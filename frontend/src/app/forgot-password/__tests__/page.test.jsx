import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock ForgotPasswordForm
vi.mock('@/components/forms/ForgotPasswordForm', () => ({
    default: () => <div data-testid="forgot-password-form">ForgotPasswordForm</div>,
}));

import ForgotPasswordPage from '../page';

describe('ForgotPasswordPage', () => {
    it('renders the page', () => {
        render(<ForgotPasswordPage />);
        expect(screen.getByTestId('forgot-password-form')).toBeInTheDocument();
    });

    it('renders the logo text', () => {
        render(<ForgotPasswordPage />);
        expect(screen.getByText('CryptoTrader')).toBeInTheDocument();
    });

    it('renders link back to login', () => {
        render(<ForgotPasswordPage />);
        expect(screen.getByText('Remembered your password?')).toBeInTheDocument();
        const loginLink = screen.getByRole('link', { name: /log in/i });
        expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('renders the ForgotPasswordForm component', () => {
        render(<ForgotPasswordPage />);
        expect(screen.getByTestId('forgot-password-form')).toBeInTheDocument();
    });
});
