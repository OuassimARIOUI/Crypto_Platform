import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ThemeToggleButton from '../ThemeToggleButton';

// Mock ThemeProvider
vi.mock('../ThemeProvider', () => ({
    toggleTheme: vi.fn(),
}));

import { toggleTheme } from '../ThemeProvider';

describe('ThemeToggleButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.documentElement.dataset.theme = 'dark';
    });

    afterEach(() => {
        document.documentElement.dataset.theme = '';
    });

    it('renders button', () => {
        render(<ThemeToggleButton />);
        
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
    });

    it('shows light_mode icon when dark theme', () => {
        document.documentElement.dataset.theme = 'dark';
        
        render(<ThemeToggleButton />);
        
        expect(screen.getByText('light_mode')).toBeInTheDocument();
    });

    it('shows dark_mode icon when light theme', () => {
        document.documentElement.dataset.theme = 'light';
        
        render(<ThemeToggleButton />);
        
        expect(screen.getByText('dark_mode')).toBeInTheDocument();
    });

    it('calls toggleTheme on click', () => {
        render(<ThemeToggleButton />);
        
        const button = screen.getByRole('button');
        fireEvent.click(button);
        
        expect(toggleTheme).toHaveBeenCalled();
    });

    it('has correct aria-label for dark theme', () => {
        document.documentElement.dataset.theme = 'dark';
        
        render(<ThemeToggleButton />);
        
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
    });

    it('has correct aria-label for light theme', () => {
        document.documentElement.dataset.theme = 'light';
        
        render(<ThemeToggleButton />);
        
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
    });

    it('applies custom className', () => {
        render(<ThemeToggleButton className="custom-class" />);
        
        const button = screen.getByRole('button');
        expect(button).toHaveClass('custom-class');
    });
});
