"use client";
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForgotPasswordForm from '../ForgotPasswordForm';

// Mock fetch
global.fetch = vi.fn();

describe('ForgotPasswordForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the form correctly', () => {
        render(<ForgotPasswordForm />);
        
        expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    });

    it('updates email input on change', () => {
        render(<ForgotPasswordForm />);
        
        const emailInput = screen.getByPlaceholderText('Enter your email address');
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        
        expect(emailInput.value).toBe('test@example.com');
    });

    it('shows success message on successful reset', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ message: 'Email sent' }),
        });

        render(<ForgotPasswordForm />);
        
        const emailInput = screen.getByPlaceholderText('Enter your email address');
        const submitButton = screen.getByRole('button', { name: /send reset link/i });
        
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('A reset link has been sent to your email.')).toBeInTheDocument();
        });
    });

    it('shows error message on failed reset', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: () => Promise.resolve({ error: 'User not found' }),
        });

        render(<ForgotPasswordForm />);
        
        const emailInput = screen.getByPlaceholderText('Enter your email address');
        const submitButton = screen.getByRole('button', { name: /send reset link/i });
        
        fireEvent.change(emailInput, { target: { value: 'unknown@example.com' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('User not found')).toBeInTheDocument();
        });
    });

    it('shows server error on network failure', async () => {
        global.fetch.mockRejectedValueOnce(new Error('Network error'));

        render(<ForgotPasswordForm />);
        
        const emailInput = screen.getByPlaceholderText('Enter your email address');
        const submitButton = screen.getByRole('button', { name: /send reset link/i });
        
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Server error.')).toBeInTheDocument();
        });
    });

    it('shows loading state while submitting', async () => {
        let resolvePromise;
        global.fetch.mockImplementationOnce(() => new Promise(resolve => {
            resolvePromise = resolve;
        }));

        render(<ForgotPasswordForm />);
        
        const emailInput = screen.getByPlaceholderText('Enter your email address');
        const submitButton = screen.getByRole('button', { name: /send reset link/i });
        
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.click(submitButton);

        expect(screen.getByText('Sending...')).toBeInTheDocument();
        expect(submitButton).toBeDisabled();

        // Resolve the promise
        resolvePromise({
            ok: true,
            json: () => Promise.resolve({}),
        });

        await waitFor(() => {
            expect(screen.getByText('Send Reset Link')).toBeInTheDocument();
        });
    });

    it('closes notification when close button clicked', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({}),
        });

        render(<ForgotPasswordForm />);
        
        const emailInput = screen.getByPlaceholderText('Enter your email address');
        const submitButton = screen.getByRole('button', { name: /send reset link/i });
        
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('A reset link has been sent to your email.')).toBeInTheDocument();
        });

        // Find and click close button by aria-label
        const closeButton = screen.getByRole('button', { name: /close notification/i });
        fireEvent.click(closeButton);

        await waitFor(() => {
            expect(screen.queryByText('A reset link has been sent to your email.')).not.toBeInTheDocument();
        });
    });
});
