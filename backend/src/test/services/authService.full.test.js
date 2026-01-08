import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies
vi.mock('../../services/dbService.js', () => ({
    prisma: {
        users: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
        },
        portfolios: {
            create: vi.fn(),
        },
    },
}));

vi.mock('bcryptjs', () => ({
    default: {
        hash: vi.fn(),
        compare: vi.fn(),
    },
}));

vi.mock('jsonwebtoken', () => ({
    default: {
        sign: vi.fn(),
    },
}));

import { prisma } from '../../services/dbService.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
    validatePseudoForRegistration,
    assertPseudoAvailable,
    register,
    login,
    sendResetEmail,
    updatePasswordWithGoogle,
} from '../../services/authService.js';

describe('authService - Full Coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret';
        process.env.API_GOOGLE_KEY = 'test-google-key';
        global.fetch = vi.fn();
    });

    describe('validatePseudoForRegistration', () => {
        it('returns normalized pseudo for valid input', () => {
            expect(validatePseudoForRegistration('abc123')).toBe('abc123');
        });

        it('throws for empty pseudo', () => {
            expect(() => validatePseudoForRegistration('')).toThrow('Pseudo requis');
        });

        it('throws for pseudo with special chars', () => {
            expect(() => validatePseudoForRegistration('abc@123')).toThrow('uniquement lettres et chiffres');
        });

        it('throws for short pseudo', () => {
            expect(() => validatePseudoForRegistration('ab12')).toThrow('minimum 6 caractères');
        });

        it('throws when not enough letters', () => {
            expect(() => validatePseudoForRegistration('aa1234')).toThrow('minimum 3 lettres et 3 chiffres');
        });

        it('throws when not enough digits', () => {
            expect(() => validatePseudoForRegistration('abcd12')).toThrow('minimum 3 lettres et 3 chiffres');
        });

        it('accepts valid pseudo with mixed case', () => {
            expect(validatePseudoForRegistration('AbC123')).toBe('AbC123');
        });
    });

    describe('assertPseudoAvailable', () => {
        it('returns normalized pseudo when available', async () => {
            prisma.users.findFirst.mockResolvedValue(null);

            const result = await assertPseudoAvailable('abc123');

            expect(result).toBe('abc123');
        });

        it('throws when pseudo exists', async () => {
            prisma.users.findFirst.mockResolvedValue({ id: 2 });

            await expect(assertPseudoAvailable('abc123')).rejects.toThrow('Ce pseudo existe déjà');
        });

        it('allows if exceptUserId matches', async () => {
            prisma.users.findFirst.mockResolvedValue({ id: 1 });

            const result = await assertPseudoAvailable('abc123', { exceptUserId: 1 });

            expect(result).toBe('abc123');
        });
    });

    describe('register', () => {
        it('registers new user successfully', async () => {
            prisma.users.findFirst.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashed_password');
            prisma.users.create.mockResolvedValue({ id: 1, email: 'test@test.com', pseudo: 'abc123' });
            prisma.portfolios.create.mockResolvedValue({});

            const result = await register('test@test.com', 'password123', 'abc123');

            expect(result.email).toBe('test@test.com');
            expect(prisma.portfolios.create).toHaveBeenCalled();
        });

        it('throws 409 for duplicate pseudo', async () => {
            prisma.users.findFirst.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashed');
            const p2002Error = new Error('Unique constraint');
            p2002Error.code = 'P2002';
            p2002Error.meta = { target: ['pseudo'] };
            prisma.users.create.mockRejectedValue(p2002Error);

            await expect(register('test@test.com', 'pass', 'abc123')).rejects.toThrow('Ce pseudo existe déjà');
        });

        it('throws 409 for duplicate email', async () => {
            prisma.users.findFirst.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashed');
            const p2002Error = new Error('Unique constraint');
            p2002Error.code = 'P2002';
            p2002Error.meta = { target: ['email'] };
            prisma.users.create.mockRejectedValue(p2002Error);

            await expect(register('test@test.com', 'pass', 'abc123')).rejects.toThrow('Cet email existe déjà');
        });

        it('throws 409 for other P2002 conflicts', async () => {
            prisma.users.findFirst.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashed');
            const p2002Error = new Error('Unique constraint');
            p2002Error.code = 'P2002';
            p2002Error.meta = { target: ['other'] };
            prisma.users.create.mockRejectedValue(p2002Error);

            await expect(register('test@test.com', 'pass', 'abc123')).rejects.toThrow('Conflit: données déjà utilisées');
        });

        it('rethrows non-P2002 errors', async () => {
            prisma.users.findFirst.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashed');
            prisma.users.create.mockRejectedValue(new Error('DB connection failed'));

            await expect(register('test@test.com', 'pass', 'abc123')).rejects.toThrow('DB connection failed');
        });
    });

    describe('login', () => {
        it('returns token for valid credentials', async () => {
            prisma.users.findUnique.mockResolvedValue({
                id: 1, email: 'test@test.com', password: 'hashed', role: 'user',
            });
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('jwt_token');

            const result = await login('test@test.com', 'password');

            expect(result.token).toBe('jwt_token');
            expect(result.user).toBeDefined();
        });

        it('returns null for non-existent user', async () => {
            prisma.users.findUnique.mockResolvedValue(null);

            const result = await login('unknown@test.com', 'password');

            expect(result).toBeNull();
        });

        it('returns null for user without password', async () => {
            prisma.users.findUnique.mockResolvedValue({
                id: 1, email: 'test@test.com', password: null,
            });

            const result = await login('test@test.com', 'password');

            expect(result).toBeNull();
        });

        it('returns null for wrong password', async () => {
            prisma.users.findUnique.mockResolvedValue({
                id: 1, email: 'test@test.com', password: 'hashed',
            });
            bcrypt.compare.mockResolvedValue(false);

            const result = await login('test@test.com', 'wrong');

            expect(result).toBeNull();
        });
    });

    describe('sendResetEmail', () => {
        it('sends reset email successfully', async () => {
            global.fetch.mockResolvedValue({
                json: vi.fn().mockResolvedValue({ email: 'test@test.com' }),
            });

            const result = await sendResetEmail('test@test.com');

            expect(result.email).toBe('test@test.com');
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('sendOobCode'),
                expect.objectContaining({
                    method: 'POST',
                })
            );
        });

        it('throws on Firebase error', async () => {
            global.fetch.mockResolvedValue({
                json: vi.fn().mockResolvedValue({ error: { message: 'EMAIL_NOT_FOUND' } }),
            });

            await expect(sendResetEmail('unknown@test.com')).rejects.toThrow('EMAIL_NOT_FOUND');
        });
    });

    describe('updatePasswordWithGoogle', () => {
        it('resets password successfully', async () => {
            global.fetch.mockResolvedValue({
                json: vi.fn().mockResolvedValue({ email: 'test@test.com' }),
            });

            const result = await updatePasswordWithGoogle('oob_code', 'newPassword123');

            expect(result.email).toBe('test@test.com');
        });

        it('throws on Firebase error', async () => {
            global.fetch.mockResolvedValue({
                json: vi.fn().mockResolvedValue({ error: { message: 'EXPIRED_OOB_CODE' } }),
            });

            await expect(updatePasswordWithGoogle('bad_code', 'pass')).rejects.toThrow('EXPIRED_OOB_CODE');
        });
    });
});
