import { describe, it, expect } from 'vitest';
import {
    getAuthActionInput,
    buildRedirectUrl,
    getAuthActionBaseParams,
    getFastRedirectPathname,
} from '../firebaseActionLink';

describe('firebaseActionLink utilities', () => {
    describe('getAuthActionInput', () => {
        it('extracts mode, oobCode and continueUrl from URLSearchParams', () => {
            const params = new URLSearchParams('mode=resetPassword&oobCode=abc123&continueUrl=https://example.com');
            const result = getAuthActionInput(params);
            expect(result).toEqual({
                mode: 'resetPassword',
                oobCode: 'abc123',
                continueUrl: 'https://example.com',
            });
        });

        it('extracts oobCode from lowercase oobcode', () => {
            const params = new URLSearchParams('mode=verifyEmail&oobcode=XYZ789');
            const result = getAuthActionInput(params);
            expect(result.oobCode).toBe('XYZ789');
        });

        it('extracts oobCode from oob_code', () => {
            const params = new URLSearchParams('mode=verifyEmail&oob_code=dash123');
            const result = getAuthActionInput(params);
            expect(result.oobCode).toBe('dash123');
        });

        it('extracts oobCode from code', () => {
            const params = new URLSearchParams('mode=verifyEmail&code=fallback456');
            const result = getAuthActionInput(params);
            expect(result.oobCode).toBe('fallback456');
        });

        it('prefers oobCode over oobcode', () => {
            const params = new URLSearchParams('oobCode=preferred&oobcode=fallback');
            const result = getAuthActionInput(params);
            expect(result.oobCode).toBe('preferred');
        });

        it('returns empty strings when params are missing', () => {
            const params = new URLSearchParams('');
            const result = getAuthActionInput(params);
            expect(result).toEqual({ mode: '', oobCode: '', continueUrl: '' });
        });

        it('returns empty strings when searchParams is null', () => {
            const result = getAuthActionInput(null);
            expect(result).toEqual({ mode: '', oobCode: '', continueUrl: '' });
        });

        it('returns empty strings when searchParams is undefined', () => {
            const result = getAuthActionInput(undefined);
            expect(result).toEqual({ mode: '', oobCode: '', continueUrl: '' });
        });

        it('works with a plain object (no .get method)', () => {
            const obj = { mode: 'verifyEmail', oobCode: 'code99', continueUrl: '' };
            const result = getAuthActionInput(obj);
            expect(result.mode).toBe('verifyEmail');
            expect(result.oobCode).toBe('code99');
        });

        it('returns empty string for missing key in plain object', () => {
            const obj = {};
            const result = getAuthActionInput(obj);
            expect(result.mode).toBe('');
        });

        it('converts non-string values to string in plain object', () => {
            const obj = { mode: 123 };
            const result = getAuthActionInput(obj);
            expect(result.mode).toBe('123');
        });

        it('returns empty string for null value in plain object', () => {
            const obj = { mode: null };
            const result = getAuthActionInput(obj);
            expect(result.mode).toBe('');
        });
    });

    describe('buildRedirectUrl', () => {
        it('builds URL with query parameters', () => {
            const url = buildRedirectUrl('/verify-email', { oobCode: 'abc', mode: 'verifyEmail' });
            expect(url).toBe('/verify-email?oobCode=abc&mode=verifyEmail');
        });

        it('returns pathname only when params is empty object', () => {
            const url = buildRedirectUrl('/reset-password', {});
            expect(url).toBe('/reset-password');
        });

        it('ignores undefined values in params', () => {
            const url = buildRedirectUrl('/path', { key: 'value', empty: undefined });
            expect(url).toContain('key=value');
        });

        it('handles params with special characters', () => {
            const url = buildRedirectUrl('/path', { continueUrl: 'https://example.com/path?foo=bar' });
            expect(url).toContain('/path?');
            expect(url).toContain('continueUrl=');
        });
    });

    describe('getAuthActionBaseParams', () => {
        it('includes oobCode in returned params', () => {
            const result = getAuthActionBaseParams({ oobCode: 'myCode', continueUrl: '' });
            expect(result.oobCode).toBe('myCode');
        });

        it('includes continueUrl when provided', () => {
            const result = getAuthActionBaseParams({ oobCode: 'myCode', continueUrl: 'https://example.com' });
            expect(result).toEqual({ oobCode: 'myCode', continueUrl: 'https://example.com' });
        });

        it('omits continueUrl when it is empty string', () => {
            const result = getAuthActionBaseParams({ oobCode: 'myCode', continueUrl: '' });
            expect(result).toEqual({ oobCode: 'myCode' });
            expect(result).not.toHaveProperty('continueUrl');
        });

        it('omits continueUrl when it is falsy', () => {
            const result = getAuthActionBaseParams({ oobCode: 'code', continueUrl: null });
            expect(result).not.toHaveProperty('continueUrl');
        });
    });

    describe('getFastRedirectPathname', () => {
        it('returns /verify-email for verifyEmail mode', () => {
            expect(getFastRedirectPathname('verifyEmail')).toBe('/verify-email');
        });

        it('returns /reset-password for resetPassword mode', () => {
            expect(getFastRedirectPathname('resetPassword')).toBe('/reset-password');
        });

        it('returns empty string for unknown modes', () => {
            expect(getFastRedirectPathname('unknown')).toBe('');
        });

        it('returns empty string for empty string mode', () => {
            expect(getFastRedirectPathname('')).toBe('');
        });

        it('returns empty string for undefined mode', () => {
            expect(getFastRedirectPathname(undefined)).toBe('');
        });
    });
});
