import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useNotification from '../useNotification';

describe('useNotification Hook', () => {
  it('initializes with no notification', () => {
    const { result } = renderHook(() => useNotification());
    expect(result.current.notification).toBeNull();
  });

  it('shows success notification', () => {
    const { result } = renderHook(() => useNotification());
    
    act(() => {
      result.current.showSuccess('Success message');
    });
    
    expect(result.current.notification).toEqual({
      message: 'Success message',
      type: 'success'
    });
  });

  it('shows error notification', () => {
    const { result } = renderHook(() => useNotification());
    
    act(() => {
      result.current.showError('Error message');
    });
    
    expect(result.current.notification).toEqual({
      message: 'Error message',
      type: 'error'
    });
  });

  it('shows warning notification', () => {
    const { result } = renderHook(() => useNotification());
    
    act(() => {
      result.current.showWarning('Warning message');
    });
    
    expect(result.current.notification).toEqual({
      message: 'Warning message',
      type: 'warning'
    });
  });

  it('shows info notification', () => {
    const { result } = renderHook(() => useNotification());
    
    act(() => {
      result.current.showInfo('Info message');
    });
    
    expect(result.current.notification).toEqual({
      message: 'Info message',
      type: 'info'
    });
  });

  it('clears notification', () => {
    const { result } = renderHook(() => useNotification());
    
    act(() => {
      result.current.showSuccess('Success');
    });
    
    expect(result.current.notification).not.toBeNull();
    
    act(() => {
      result.current.clearNotification();
    });
    
    expect(result.current.notification).toBeNull();
  });

  it('replaces previous notification', () => {
    const { result } = renderHook(() => useNotification());
    
    act(() => {
      result.current.showSuccess('First');
    });
    
    expect(result.current.notification.message).toBe('First');
    
    act(() => {
      result.current.showError('Second');
    });
    
    expect(result.current.notification.message).toBe('Second');
    expect(result.current.notification.type).toBe('error');
  });
});
