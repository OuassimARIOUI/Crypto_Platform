"use client";
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ThemeProvider, { toggleTheme } from '../ThemeProvider';

describe('ThemeProvider', () => {
    beforeEach(() => {
        // Reset document state
        document.documentElement.dataset.theme = '';
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('renders children', () => {
        render(
            <ThemeProvider>
                <div>Test Content</div>
            </ThemeProvider>
        );
        
        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('applies dark theme by default', () => {
        render(
            <ThemeProvider>
                <div>Test</div>
            </ThemeProvider>
        );
        
        expect(document.documentElement.dataset.theme).toBe('dark');
    });

    it('applies stored light theme', () => {
        localStorage.setItem('theme', 'light');
        
        render(
            <ThemeProvider>
                <div>Test</div>
            </ThemeProvider>
        );
        
        expect(document.documentElement.dataset.theme).toBe('light');
    });

    it('applies stored dark theme', () => {
        localStorage.setItem('theme', 'dark');
        
        render(
            <ThemeProvider>
                <div>Test</div>
            </ThemeProvider>
        );
        
        expect(document.documentElement.dataset.theme).toBe('dark');
    });

    it('ignores invalid stored theme', () => {
        localStorage.setItem('theme', 'invalid');
        
        render(
            <ThemeProvider>
                <div>Test</div>
            </ThemeProvider>
        );
        
        expect(document.documentElement.dataset.theme).toBe('dark');
    });
});

describe('toggleTheme', () => {
    beforeEach(() => {
        document.documentElement.dataset.theme = 'dark';
        localStorage.clear();
    });

    it('toggles from dark to light', () => {
        document.documentElement.dataset.theme = 'dark';
        
        toggleTheme();
        
        expect(document.documentElement.dataset.theme).toBe('light');
        expect(localStorage.getItem('theme')).toBe('light');
    });

    it('toggles from light to dark', () => {
        document.documentElement.dataset.theme = 'light';
        
        toggleTheme();
        
        expect(document.documentElement.dataset.theme).toBe('dark');
        expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('defaults to dark when toggling from undefined', () => {
        document.documentElement.dataset.theme = '';
        
        toggleTheme();
        
        expect(document.documentElement.dataset.theme).toBe('light');
    });
});
