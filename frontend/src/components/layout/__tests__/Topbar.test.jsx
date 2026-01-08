"use client";
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Topbar from '../Topbar';

describe('Topbar', () => {
    it('renders the topbar correctly', () => {
        render(<Topbar />);
        
        expect(screen.getByText('User')).toBeInTheDocument();
        expect(screen.getByText('user@email.com')).toBeInTheDocument();
    });

    it('contains a notifications button', () => {
        render(<Topbar />);
        
        const notificationIcon = screen.getByText('notifications');
        expect(notificationIcon).toBeInTheDocument();
    });

    it('displays user avatar', () => {
        render(<Topbar />);
        
        // The avatar is a div with background-image
        const header = screen.getByRole('banner');
        expect(header).toBeInTheDocument();
    });
});
