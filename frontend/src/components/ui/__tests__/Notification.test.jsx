import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Notification from '../Notification';

describe('Notification Component', () => {
  it('renders notification with message', () => {
    render(<Notification message="Test notification" type="success" />);
    expect(screen.getByText('Test notification')).toBeInTheDocument();
  });

  it('returns null when no message', () => {
    const { container } = render(<Notification type="info" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders success notification with correct styling', () => {
    const { container } = render(<Notification message="Success" type="success" />);
    expect(container.firstChild.className).toContain('bg-green');
  });

  it('renders error notification with correct styling', () => {
    const { container } = render(<Notification message="Error" type="error" />);
    expect(container.firstChild.className).toContain('bg-red');
  });

  it('renders warning notification with correct styling', () => {
    const { container } = render(<Notification message="Warning" type="warning" />);
    expect(container.firstChild.className).toContain('bg-yellow');
  });

  it('renders info notification with correct styling', () => {
    const { container } = render(<Notification message="Info" type="info" />);
    expect(container.firstChild.className).toContain('primary');
  });

  it('renders close button when onClose is provided', () => {
    const handleClose = vi.fn();
    render(<Notification message="Test" type="info" onClose={handleClose} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const handleClose = vi.fn();
    render(<Notification message="Test" type="info" onClose={handleClose} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not render close button when onClose is not provided', () => {
    render(<Notification message="Test" type="info" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('has default type of info', () => {
    const { container } = render(<Notification message="Default" />);
    expect(container.firstChild.className).toContain('primary');
  });
});
