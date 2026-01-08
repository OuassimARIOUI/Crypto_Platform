import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ForbiddenPage from '../page';

describe('ForbiddenPage', () => {
    it('renders default 403 code', () => {
        render(<ForbiddenPage searchParams={{}} />);
        expect(screen.getByText('403')).toBeInTheDocument();
    });

    it('renders custom error code from searchParams', () => {
        render(<ForbiddenPage searchParams={{ code: '401' }} />);
        expect(screen.getByText('401')).toBeInTheDocument();
    });

    it('renders access denied message in French', () => {
        render(<ForbiddenPage searchParams={{}} />);
        expect(screen.getByText('Accès refusé')).toBeInTheDocument();
    });

    it('renders link to dashboard', () => {
        render(<ForbiddenPage searchParams={{}} />);
        const link = screen.getByRole('link', { name: /revenir au dashboard/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/dashboard');
    });

    it('displays code in footer', () => {
        render(<ForbiddenPage searchParams={{ code: '500' }} />);
        expect(screen.getByText('Code: 500')).toBeInTheDocument();
    });

    it('handles undefined searchParams', () => {
        render(<ForbiddenPage searchParams={undefined} />);
        expect(screen.getByText('403')).toBeInTheDocument();
    });
});
