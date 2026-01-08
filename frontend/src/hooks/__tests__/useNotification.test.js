import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotification } from '../useNotification';

describe('useNotification Hook', () => {
  it('initializes with no notification', () => {
    const { result } = renderHook(() => useNotification());
    expect(result.current.notification).toBeNull();
  });

  it('shows notification with showNotification', () => {
    const { result } = renderHook(() => useNotification());
    
    act(() => {
      result.current.showNotification('Test message', 'success');
    });
    
    expect(result.current.notification).toEqual({
      message: 'Test message',
      type: 'success',
      duration: 5000
    });
  });

  it('shows notification with default type info', () => {
    const { result } = renderHook(() => useNotification());
    
    act(() => {
      result.current.showNotification('Info message');
    });
    
    expect(result.current.notification.type).toBe('info');
  });

  it('shows notification with custom duration', () => {
    const { result } = renderHook(() => useNotification());
    
    act(() => {
      result.current.showNotification('Custom duration', 'warning', 10000);
    });
    
    expect(result.current.notification.duration).toBe(10000);
  });

  it('hides notification', () => {
    const { result } = renderHook(() => useNotification());
    
    act(() => {
      result.current.showNotification('Test');
    });
    
    expect(result.current.notification).not.toBeNull();
    
    act(() => {
      result.current.hideNotification();
    });
    
    expect(result.current.notification).toBeNull();
  });

  it('replaces previous notification', () => {
    const { result } = renderHook(() => useNotification());
    
    act(() => {
      result.current.showNotification('First', 'info');
    });
    
    expect(result.current.notification.message).toBe('First');
    
    act(() => {
      result.current.showNotification('Second', 'error');
    });
    
    expect(result.current.notification.message).toBe('Second');
    expect(result.current.notification.type).toBe('error');
  });

  it('returns stable function references', () => {
    const { result, rerender } = renderHook(() => useNotification());
    
    const showNotification1 = result.current.showNotification;
    const hideNotification1 = result.current.hideNotification;
    
    rerender();
    
    expect(result.current.showNotification).toBe(showNotification1);
    expect(result.current.hideNotification).toBe(hideNotification1);
  });

  it('handles different notification types', () => {
    const { result } = renderHook(() => useNotification());
    const types = ['info', 'success', 'error', 'warning'];
    
    types.forEach(type => {
      act(() => {
        result.current.showNotification(`${type} message`, type);
      });
      
      expect(result.current.notification.type).toBe(type);
    });
  });
});
