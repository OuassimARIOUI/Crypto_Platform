import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Notification from '../Notification';

describe('Notification Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders notification with message', () => {
    render(<Notification message="Test notification" type="success" />);
    expect(screen.getByText('Test notification')).toBeInTheDocument();
  });

  it('renders success notification with correct styling', () => {
    const { container } = render(<Notification message="Success" type="success" />);
    expect(container.firstChild).toHaveClass('bg-green-500');
  });

  it('renders error notification with correct styling', () => {
    const { container } = render(<Notification message="Error" type="error" />);
    expect(container.firstChild).toHaveClass('bg-red-500');
  });

  it('renders warning notification with correct styling', () => {
    const { container } = render(<Notification message="Warning" type="warning" />);
    expect(container.firstChild).toHaveClass('bg-yellow-500');
  });

  it('renders info notification with correct styling', () => {
    const { container } = render(<Notification message="Info" type="info" />);
    expect(container.firstChild).toHaveClass('bg-blue-500');
  });

  it('calls onClose when provided', () => {
    const handleClose = vi.fn();
    render(<Notification message="Test" type="info" onClose={handleClose} />);
    
    vi.advanceTimersByTime(3000);
    expect(handleClose).toHaveBeenCalled();
  });

  it('does not auto-close if onClose is not provided', () => {
    render(<Notification message="Test" type="info" />);
    vi.advanceTimersByTime(5000);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
