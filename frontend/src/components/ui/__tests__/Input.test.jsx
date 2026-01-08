import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Input from '../Input';

describe('Input Component', () => {
  it('renders input element', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('handles value changes', () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} placeholder="Test" />);
    
    const input = screen.getByPlaceholderText('Test');
    fireEvent.change(input, { target: { value: 'test' } });
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('renders with label', () => {
    render(<Input label="Email" placeholder="test" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders with different types', () => {
    const { rerender } = render(<Input type="email" placeholder="email" />);
    expect(screen.getByPlaceholderText('email')).toHaveAttribute('type', 'email');
    
    rerender(<Input type="password" placeholder="password" />);
    expect(screen.getByPlaceholderText('password')).toHaveAttribute('type', 'password');
  });

  it('has default type of text', () => {
    render(<Input placeholder="default" />);
    expect(screen.getByPlaceholderText('default')).toHaveAttribute('type', 'text');
  });

  it('displays value prop', () => {
    render(<Input value="test value" onChange={() => {}} placeholder="test" />);
    expect(screen.getByPlaceholderText('test')).toHaveValue('test value');
  });

  it('applies styling classes', () => {
    render(<Input placeholder="styled" />);
    const input = screen.getByPlaceholderText('styled');
    expect(input.className).toContain('rounded-lg');
  });

  it('renders without label when not provided', () => {
    const { container } = render(<Input placeholder="no-label" />);
    expect(container.querySelector('p')).toBeNull();
  });
});
