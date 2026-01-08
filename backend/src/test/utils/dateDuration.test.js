import { describe, it, expect, beforeEach, vi } from 'vitest';
import { addDurationToNow } from '../../utils/dateDuration.js';

describe('dateDuration utils', () => {
    beforeEach(() => {
        // Mock Date.now() for consistent testing
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-01-01T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('addDurationToNow', () => {
        it('returns null for null duration', () => {
            const result = addDurationToNow(null);
            expect(result).toBeNull();
        });

        it('returns null for undefined duration', () => {
            const result = addDurationToNow(undefined);
            expect(result).toBeNull();
        });

        it('returns null for non-object duration', () => {
            expect(addDurationToNow('string')).toBeNull();
            expect(addDurationToNow(123)).toBeNull();
            expect(addDurationToNow(true)).toBeNull();
        });

        it('returns null for empty duration object', () => {
            const result = addDurationToNow({});
            expect(result).toBeNull();
        });

        it('returns null when all values are zero', () => {
            const result = addDurationToNow({
                days: 0,
                hours: 0,
                minutes: 0,
                months: 0,
            });
            expect(result).toBeNull();
        });

        it('returns null when all values are NaN', () => {
            const result = addDurationToNow({
                days: NaN,
                hours: NaN,
                minutes: NaN,
                months: NaN,
            });
            expect(result).toBeNull();
        });

        it('adds days correctly', () => {
            const result = addDurationToNow({ days: 5 });
            expect(result).toBeInstanceOf(Date);
            expect(result.getDate()).toBe(6); // Jan 1 + 5 days = Jan 6
        });

        it('adds hours correctly', () => {
            const mockNow = new Date('2025-01-01T12:00:00Z');
            vi.setSystemTime(mockNow);
            const result = addDurationToNow({ hours: 3 });
            expect(result).toBeInstanceOf(Date);
            // Check that 3 hours were added (10800000 ms)
            expect(result.getTime() - mockNow.getTime()).toBe(3 * 60 * 60 * 1000);
        });

        it('adds minutes correctly', () => {
            const result = addDurationToNow({ minutes: 30 });
            expect(result).toBeInstanceOf(Date);
            expect(result.getMinutes()).toBe(30);
        });

        it('adds months correctly', () => {
            const result = addDurationToNow({ months: 2 });
            expect(result).toBeInstanceOf(Date);
            expect(result.getMonth()).toBe(2); // January (0) + 2 = March (2)
        });

        it('combines multiple duration units', () => {
            const mockNow = new Date('2025-01-01T12:00:00Z');
            vi.setSystemTime(mockNow);
            const result = addDurationToNow({
                days: 1,
                hours: 2,
                minutes: 30,
                months: 1,
            });
            expect(result).toBeInstanceOf(Date);
            // Feb 2, at mockNow + 1 day + 2 hours + 30 minutes
            expect(result.getUTCMonth()).toBe(1); // February
            expect(result.getUTCDate()).toBe(2);
            expect(result.getUTCHours()).toBe(14);
            expect(result.getUTCMinutes()).toBe(30);
        });

        it('handles string number values', () => {
            const result = addDurationToNow({ days: '5' });
            expect(result).toBeInstanceOf(Date);
            expect(result.getDate()).toBe(6);
        });

        it('handles partial duration with some undefined values', () => {
            const result = addDurationToNow({
                days: 2,
                hours: undefined,
            });
            expect(result).toBeInstanceOf(Date);
            expect(result.getDate()).toBe(3);
        });

        it('handles negative values', () => {
            const result = addDurationToNow({ days: -1 });
            expect(result).toBeInstanceOf(Date);
            expect(result.getDate()).toBe(31); // Dec 31
        });

        it('handles month overflow correctly', () => {
            vi.setSystemTime(new Date('2025-11-15T12:00:00Z')); // November 15
            const result = addDurationToNow({ months: 3 });
            expect(result.getMonth()).toBe(1); // February (0 + 3 = 3, but Nov + 3 = Feb next year)
            expect(result.getFullYear()).toBe(2026);
        });

        it('handles day overflow to next month', () => {
            vi.setSystemTime(new Date('2025-01-30T12:00:00Z'));
            const result = addDurationToNow({ days: 5 });
            expect(result.getMonth()).toBe(1); // February
            expect(result.getDate()).toBe(4);
        });
    });
});
