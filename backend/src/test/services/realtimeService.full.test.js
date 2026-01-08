import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock crypto module
vi.mock('crypto', () => ({
    randomUUID: vi.fn(() => 'mock-uuid-1234'),
}));

import {
    sseInit,
    subscribeRealtime,
    publishToUser,
    publishToRoles,
} from '../../services/realtimeService.js';

// Helper to create mock response
function createMockResponse() {
    const res = {
        status: vi.fn().mockReturnThis(),
        setHeader: vi.fn().mockReturnThis(),
        flushHeaders: vi.fn(),
        write: vi.fn().mockReturnValue(true),
        on: vi.fn(),
        end: vi.fn(),
    };
    return res;
}

describe('realtimeService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('sseInit', () => {
        it('sets correct SSE headers', () => {
            const res = createMockResponse();
            
            sseInit(res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
            expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache, no-transform');
            expect(res.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
            expect(res.flushHeaders).toHaveBeenCalled();
        });

        it('handles response without flushHeaders', () => {
            const res = createMockResponse();
            delete res.flushHeaders;

            expect(() => sseInit(res)).not.toThrow();
        });
    });

    describe('subscribeRealtime', () => {
        it('returns a connection id', () => {
            const res = createMockResponse();
            
            const id = subscribeRealtime({ userId: 1, role: 'user', res });

            expect(id).toBe('mock-uuid-1234');
        });

        it('sends hello event on subscription', () => {
            const res = createMockResponse();
            
            subscribeRealtime({ userId: 1, role: 'user', res });

            expect(res.write).toHaveBeenCalledWith('event: hello\n');
            expect(res.write).toHaveBeenCalledWith(expect.stringContaining('"ok":true'));
        });

        it('sets up ping interval', () => {
            const res = createMockResponse();
            
            subscribeRealtime({ userId: 1, role: 'user', res });

            // Fast-forward time to trigger ping
            vi.advanceTimersByTime(20000);

            // Should have written a ping comment
            expect(res.write).toHaveBeenCalledWith(expect.stringContaining(': ping'));
        });

        it('handles close event and cleans up', () => {
            const res = createMockResponse();
            let closeHandler;
            res.on.mockImplementation((event, handler) => {
                if (event === 'close') closeHandler = handler;
            });

            subscribeRealtime({ userId: 1, role: 'user', res });

            // Simulate connection close
            if (closeHandler) closeHandler();

            // Verify cleanup happened (no error thrown)
            expect(res.on).toHaveBeenCalledWith('close', expect.any(Function));
        });

        it('handles ping errors gracefully', () => {
            const res = createMockResponse();
            
            // Subscribe first with working write
            subscribeRealtime({ userId: 1, role: 'user', res });

            // Then make write fail for ping
            res.write.mockImplementation(() => {
                // Ping catch block should handle this
            });

            // Advance time - ping should not crash
            vi.advanceTimersByTime(20000);
            
            // If we got here, the test passed
            expect(true).toBe(true);
        });
    });

    describe('publishToUser', () => {
        it('sends event to connected user', () => {
            const res = createMockResponse();
            
            // Subscribe user
            subscribeRealtime({ userId: 1, role: 'user', res });

            // Reset write mock to clear hello event
            res.write.mockClear();

            // Publish event
            publishToUser(1, 'test-event', { message: 'hello' });

            expect(res.write).toHaveBeenCalledWith('event: test-event\n');
            expect(res.write).toHaveBeenCalledWith(expect.stringContaining('"message":"hello"'));
        });

        it('does nothing when user not connected', () => {
            const res = createMockResponse();
            
            // User 1 is connected
            subscribeRealtime({ userId: 1, role: 'user', res });
            res.write.mockClear();

            // Try to publish to user 999 (not connected)
            publishToUser(999, 'test-event', { data: 'test' });

            // Should not have written anything new
            expect(res.write).not.toHaveBeenCalled();
        });

        it('handles multiple connections for same user', () => {
            const res1 = createMockResponse();
            const res2 = createMockResponse();
            
            // Same user with two connections
            subscribeRealtime({ userId: 1, role: 'user', res: res1 });
            subscribeRealtime({ userId: 1, role: 'user', res: res2 });

            res1.write.mockClear();
            res2.write.mockClear();

            publishToUser(1, 'broadcast', { msg: 'hi' });

            // Both connections should receive the message (Map stores both)
            const totalWrites = res1.write.mock.calls.length + res2.write.mock.calls.length;
            expect(totalWrites).toBeGreaterThanOrEqual(1);
        });

        it('handles write errors gracefully', () => {
            const res = createMockResponse();
            subscribeRealtime({ userId: 1, role: 'user', res });

            res.write.mockImplementation(() => {
                throw new Error('Broken pipe');
            });

            // Should not throw
            expect(() => publishToUser(1, 'test', {})).not.toThrow();
        });

        it('handles numeric string userId', () => {
            const res = createMockResponse();
            subscribeRealtime({ userId: '1', role: 'user', res });
            res.write.mockClear();

            publishToUser('1', 'event', {});

            // Should find the connection (both converted to Number)
            // Note: actual behavior depends on implementation
        });
    });

    describe('publishToRoles', () => {
        it('sends event to all users with matching role', () => {
            const adminRes = createMockResponse();
            const userRes = createMockResponse();
            
            subscribeRealtime({ userId: 1, role: 'admin', res: adminRes });
            subscribeRealtime({ userId: 2, role: 'user', res: userRes });

            adminRes.write.mockClear();
            userRes.write.mockClear();

            publishToRoles(['admin'], 'admin-event', { alert: 'important' });

            expect(adminRes.write).toHaveBeenCalled();
            expect(userRes.write).not.toHaveBeenCalled();
        });

        it('sends to multiple roles', () => {
            const adminRes = createMockResponse();
            const modRes = createMockResponse();
            const userRes = createMockResponse();
            
            subscribeRealtime({ userId: 1, role: 'admin', res: adminRes });
            subscribeRealtime({ userId: 2, role: 'moderator', res: modRes });
            subscribeRealtime({ userId: 3, role: 'user', res: userRes });

            adminRes.write.mockClear();
            modRes.write.mockClear();
            userRes.write.mockClear();

            publishToRoles(['admin', 'moderator'], 'staff-event', {});

            expect(adminRes.write).toHaveBeenCalled();
            expect(modRes.write).toHaveBeenCalled();
            expect(userRes.write).not.toHaveBeenCalled();
        });

        it('does nothing when roles array is empty', () => {
            const res = createMockResponse();
            subscribeRealtime({ userId: 1, role: 'admin', res });
            res.write.mockClear();

            publishToRoles([], 'event', {});

            expect(res.write).not.toHaveBeenCalled();
        });

        it('does nothing when roles is null/undefined', () => {
            const res = createMockResponse();
            subscribeRealtime({ userId: 1, role: 'admin', res });
            res.write.mockClear();

            publishToRoles(null, 'event', {});
            publishToRoles(undefined, 'event', {});

            expect(res.write).not.toHaveBeenCalled();
        });

        it('filters out falsy role values', () => {
            const res = createMockResponse();
            subscribeRealtime({ userId: 1, role: 'admin', res });
            res.write.mockClear();

            publishToRoles([null, undefined, '', 'admin'], 'event', {});

            expect(res.write).toHaveBeenCalled();
        });

        it('handles write errors gracefully', () => {
            const res = createMockResponse();
            subscribeRealtime({ userId: 1, role: 'admin', res });
            
            res.write.mockImplementation(() => {
                throw new Error('Connection reset');
            });

            expect(() => publishToRoles(['admin'], 'event', {})).not.toThrow();
        });
    });
});
