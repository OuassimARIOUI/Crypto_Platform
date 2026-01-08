"use client";
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddFunds from '../AddFunds';

// Mock js-cookie
vi.mock('js-cookie', () => ({
    default: {
        get: vi.fn(),
        remove: vi.fn(),
    },
}));

import Cookies from 'js-cookie';

// Mock fetch
global.fetch = vi.fn();

describe('AddFunds', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Cookies.get.mockReturnValue('test-token');
    });

    it('renders the form correctly', () => {
        render(<AddFunds />);
        
        expect(screen.getByText('Add Credit')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Montant')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /ajouter/i })).toBeInTheDocument();
    });

    it('updates amount input on change', () => {
        render(<AddFunds />);
        
        const amountInput = screen.getByPlaceholderText('Montant');
        fireEvent.change(amountInput, { target: { value: '100' } });
        
        expect(amountInput.value).toBe('100');
    });

    it('does nothing when no token', async () => {
        Cookies.get.mockReturnValue(null);
        render(<AddFunds />);
        
        const submitButton = screen.getByRole('button', { name: /ajouter/i });
        fireEvent.click(submitButton);

        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('shows success message after adding funds', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ balance: 500 }),
        });

        render(<AddFunds />);
        
        const amountInput = screen.getByPlaceholderText('Montant');
        const submitButton = screen.getByRole('button', { name: /ajouter/i });
        
        fireEvent.change(amountInput, { target: { value: '100' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/Crédit ajouté/)).toBeInTheDocument();
            expect(screen.getByText(/\$500/)).toBeInTheDocument();
        });
    });

    it('shows error message on failure', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: () => Promise.resolve({ error: 'Insufficient balance' }),
        });

        render(<AddFunds />);
        
        const amountInput = screen.getByPlaceholderText('Montant');
        const submitButton = screen.getByRole('button', { name: /ajouter/i });
        
        fireEvent.change(amountInput, { target: { value: '100' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/Erreur/)).toBeInTheDocument();
            expect(screen.getByText(/Insufficient balance/)).toBeInTheDocument();
        });
    });

    it('sends correct authorization header', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ balance: 100 }),
        });

        render(<AddFunds />);
        
        const amountInput = screen.getByPlaceholderText('Montant');
        const submitButton = screen.getByRole('button', { name: /ajouter/i });
        
        fireEvent.change(amountInput, { target: { value: '50' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:3004/portfolio/add-funds',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        Authorization: 'Bearer test-token',
                    }),
                    body: JSON.stringify({ amount: 50 }),
                })
            );
        });
    });
});
