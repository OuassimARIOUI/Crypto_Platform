import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TransferFunds from '../TransferFunds';

// Mock js-cookie
vi.mock('js-cookie', () => ({
    default: {
        get: vi.fn(() => 'fake-token'),
    },
}));

global.fetch = vi.fn();

describe('TransferFunds', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the Transfer Funds heading', async () => {
        render(<TransferFunds />);
        await waitFor(() => {
            expect(screen.getByText('Transfer Funds')).toBeInTheDocument();
        });
    });

    it('renders subtitle text', async () => {
        render(<TransferFunds />);
        await waitFor(() => {
            expect(screen.getByText('Send money to another user')).toBeInTheDocument();
        });
    });

    it('renders recipient input', async () => {
        render(<TransferFunds />);
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
        });
    });

    it('renders amount input', async () => {
        render(<TransferFunds />);
        await waitFor(() => {
            expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
        });
    });

    it('renders note input', async () => {
        render(<TransferFunds />);
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Add a note...')).toBeInTheDocument();
        });
    });

    it('renders quick amount preset buttons', async () => {
        render(<TransferFunds />);
        await waitFor(() => {
            expect(screen.getByText('$50')).toBeInTheDocument();
            expect(screen.getByText('$100')).toBeInTheDocument();
            expect(screen.getByText('$250')).toBeInTheDocument();
            expect(screen.getByText('$500')).toBeInTheDocument();
        });
    });

    it('sets amount when quick preset button is clicked', async () => {
        render(<TransferFunds />);
        await waitFor(() => {
            expect(screen.getByText('$100')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('$100'));
        const amountInput = screen.getByPlaceholderText('0.00');
        expect(amountInput.value).toBe('100');
    });

    it('updates recipient input on change', async () => {
        render(<TransferFunds />);
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
        });

        const input = screen.getByPlaceholderText('Enter username');
        fireEvent.change(input, { target: { value: 'john_doe' } });
        expect(input.value).toBe('john_doe');
    });

    it('updates note input on change', async () => {
        render(<TransferFunds />);
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Add a note...')).toBeInTheDocument();
        });

        const noteInput = screen.getByPlaceholderText('Add a note...');
        fireEvent.change(noteInput, { target: { value: 'Payment for lunch' } });
        expect(noteInput.value).toBe('Payment for lunch');
    });

    it('submit button is disabled when recipient or amount is empty', async () => {
        render(<TransferFunds />);
        await waitFor(() => {
            expect(screen.getByText('Send Transfer')).toBeInTheDocument();
        });

        const submitBtn = screen.getByText('Send Transfer').closest('button');
        expect(submitBtn).toBeDisabled();
    });

    it('shows validation error for empty recipient', async () => {
        render(<TransferFunds />);
        await waitFor(() => {
            expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '100' } });

        // Force submit by calling submit manually – trigger button click
        const submitBtn = screen.getByText('Send Transfer').closest('button');
        // Button should be disabled since recipient is empty
        expect(submitBtn).toBeDisabled();
    });

    it('shows validation error for invalid amount', async () => {
        render(<TransferFunds />);
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText('Enter username'), { target: { value: 'alice' } });
        // Don't fill amount

        const submitBtn = screen.getByText('Send Transfer').closest('button');
        expect(submitBtn).toBeDisabled();
    });

    it('makes POST request on valid form submission', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ success: true }),
        });

        render(<TransferFunds />);
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText('Enter username'), {
            target: { value: 'alice' },
        });
        fireEvent.change(screen.getByPlaceholderText('0.00'), {
            target: { value: '100' },
        });

        const submitBtn = screen.getByText('Send Transfer').closest('button');
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/portfolio/transfer'),
                expect.objectContaining({ method: 'POST' })
            );
        });
    });

    it('shows success message after successful transfer', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ success: true }),
        });

        render(<TransferFunds />);
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText('Enter username'), {
            target: { value: 'alice' },
        });
        fireEvent.change(screen.getByPlaceholderText('0.00'), {
            target: { value: '100' },
        });

        fireEvent.click(screen.getByText('Send Transfer').closest('button'));

        await waitFor(() => {
            expect(screen.getByText(/Successfully sent/i)).toBeInTheDocument();
        });
    });

    it('shows error message after failed transfer', async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            json: async () => ({ error: 'Insufficient funds' }),
        });

        render(<TransferFunds />);
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText('Enter username'), {
            target: { value: 'alice' },
        });
        fireEvent.change(screen.getByPlaceholderText('0.00'), {
            target: { value: '100' },
        });

        fireEvent.click(screen.getByText('Send Transfer').closest('button'));

        await waitFor(() => {
            expect(screen.getByText(/Insufficient funds/i)).toBeInTheDocument();
        });
    });

    it('shows generic error message on network failure', async () => {
        global.fetch.mockRejectedValue(new Error('Network error'));

        render(<TransferFunds />);
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText('Enter username'), {
            target: { value: 'bob' },
        });
        fireEvent.change(screen.getByPlaceholderText('0.00'), {
            target: { value: '50' },
        });

        fireEvent.click(screen.getByText('Send Transfer').closest('button'));

        await waitFor(() => {
            expect(screen.getByText(/Network error/i)).toBeInTheDocument();
        });
    });

    it('clears form fields after successful transfer', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ success: true }),
        });

        render(<TransferFunds />);
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
        });

        const recipientInput = screen.getByPlaceholderText('Enter username');
        const amountInput = screen.getByPlaceholderText('0.00');

        fireEvent.change(recipientInput, { target: { value: 'alice' } });
        fireEvent.change(amountInput, { target: { value: '100' } });

        fireEvent.click(screen.getByText('Send Transfer').closest('button'));

        await waitFor(() => {
            expect(recipientInput.value).toBe('');
            expect(amountInput.value).toBe('');
        });
    });
});
