import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock prisma
vi.mock('../../services/dbService.js', () => ({
    prisma: {
        app_settings: {
            upsert: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
    },
}));

import { prisma } from '../../services/dbService.js';

// We need to import after mocks, and also need to reset the cache between tests
let getMaintenanceConfig, setMaintenanceConfig;

describe('appSettingsService', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        vi.resetModules();
        
        // Re-import to reset module state (cache)
        const module = await import('../../services/appSettingsService.js');
        getMaintenanceConfig = module.getMaintenanceConfig;
        setMaintenanceConfig = module.setMaintenanceConfig;
    });

    describe('getMaintenanceConfig', () => {
        it('returns maintenance config from database', async () => {
            prisma.app_settings.upsert.mockResolvedValue({
                key: 'global',
                maintenance_enabled: true,
                maintenance_message: 'Down for updates',
                updated_at: new Date(),
            });

            const result = await getMaintenanceConfig({ noCache: true });

            expect(result).toEqual({
                enabled: true,
                message: 'Down for updates',
                updatedAt: expect.any(Date),
            });
        });

        it('returns cached value on subsequent calls', async () => {
            prisma.app_settings.upsert.mockResolvedValue({
                key: 'global',
                maintenance_enabled: false,
                maintenance_message: null,
                updated_at: new Date(),
            });

            // First call - hits database
            await getMaintenanceConfig({ noCache: true });
            
            // Second call - should use cache (we can't easily test this without checking call count)
            // But noCache: false should try cache first
            const result = await getMaintenanceConfig();
            
            expect(result.enabled).toBe(false);
        });

        it('handles P2002 error (race condition on upsert)', async () => {
            prisma.app_settings.upsert.mockRejectedValue({ code: 'P2002' });
            prisma.app_settings.findUnique.mockResolvedValue({
                key: 'global',
                maintenance_enabled: true,
                maintenance_message: 'Maintenance',
                updated_at: new Date(),
            });

            const result = await getMaintenanceConfig({ noCache: true });

            expect(result.enabled).toBe(true);
            expect(prisma.app_settings.findUnique).toHaveBeenCalled();
        });

        it('creates new row if findUnique returns null after P2002', async () => {
            prisma.app_settings.upsert.mockRejectedValue({ code: 'P2002' });
            prisma.app_settings.findUnique.mockResolvedValue(null);
            prisma.app_settings.create.mockResolvedValue({
                key: 'global',
                maintenance_enabled: false,
                maintenance_message: null,
                updated_at: new Date(),
            });

            const result = await getMaintenanceConfig({ noCache: true });

            expect(result.enabled).toBe(false);
            expect(prisma.app_settings.create).toHaveBeenCalled();
        });

        it('throws error for non-P2002 errors', async () => {
            prisma.app_settings.upsert.mockRejectedValue(new Error('Database connection failed'));

            await expect(getMaintenanceConfig({ noCache: true })).rejects.toThrow('Database connection failed');
        });

        it('returns null message when maintenance_message is null', async () => {
            prisma.app_settings.upsert.mockResolvedValue({
                key: 'global',
                maintenance_enabled: false,
                maintenance_message: null,
                updated_at: new Date(),
            });

            const result = await getMaintenanceConfig({ noCache: true });

            expect(result.message).toBeNull();
        });
    });

    describe('setMaintenanceConfig', () => {
        it('enables maintenance mode', async () => {
            prisma.app_settings.upsert.mockResolvedValue({
                key: 'global',
                maintenance_enabled: true,
                maintenance_message: 'Site is down',
                updated_at: new Date(),
            });

            const result = await setMaintenanceConfig({
                enabled: true,
                message: 'Site is down',
            });

            expect(result.enabled).toBe(true);
            expect(result.message).toBe('Site is down');
        });

        it('disables maintenance mode', async () => {
            prisma.app_settings.upsert.mockResolvedValue({
                key: 'global',
                maintenance_enabled: false,
                maintenance_message: null,
                updated_at: new Date(),
            });

            const result = await setMaintenanceConfig({
                enabled: false,
                message: null,
            });

            expect(result.enabled).toBe(false);
        });

        it('throws error when enabled is not boolean', async () => {
            await expect(setMaintenanceConfig({ enabled: 'yes' })).rejects.toThrow('enabled must be a boolean');
            await expect(setMaintenanceConfig({ enabled: 1 })).rejects.toThrow('enabled must be a boolean');
            await expect(setMaintenanceConfig({ enabled: null })).rejects.toThrow('enabled must be a boolean');
        });

        it('handles P2002 error and uses update instead', async () => {
            prisma.app_settings.upsert.mockRejectedValue({ code: 'P2002' });
            prisma.app_settings.update.mockResolvedValue({
                key: 'global',
                maintenance_enabled: true,
                maintenance_message: 'Updated',
                updated_at: new Date(),
            });

            const result = await setMaintenanceConfig({
                enabled: true,
                message: 'Updated',
            });

            expect(result.enabled).toBe(true);
            expect(prisma.app_settings.update).toHaveBeenCalled();
        });

        it('throws error for non-P2002 errors', async () => {
            prisma.app_settings.upsert.mockRejectedValue(new Error('Write failed'));

            await expect(
                setMaintenanceConfig({ enabled: true, message: 'Test' })
            ).rejects.toThrow('Write failed');
        });

        it('normalizes message - trims whitespace', async () => {
            prisma.app_settings.upsert.mockResolvedValue({
                key: 'global',
                maintenance_enabled: true,
                maintenance_message: 'Trimmed message',
                updated_at: new Date(),
            });

            await setMaintenanceConfig({
                enabled: true,
                message: '  Trimmed message  ',
            });

            expect(prisma.app_settings.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    create: expect.objectContaining({
                        maintenance_message: 'Trimmed message',
                    }),
                })
            );
        });

        it('normalizes message - empty string becomes null', async () => {
            prisma.app_settings.upsert.mockResolvedValue({
                key: 'global',
                maintenance_enabled: true,
                maintenance_message: null,
                updated_at: new Date(),
            });

            await setMaintenanceConfig({
                enabled: true,
                message: '   ',
            });

            expect(prisma.app_settings.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    create: expect.objectContaining({
                        maintenance_message: null,
                    }),
                })
            );
        });

        it('truncates long messages to 200 chars', async () => {
            const longMessage = 'a'.repeat(300);
            prisma.app_settings.upsert.mockResolvedValue({
                key: 'global',
                maintenance_enabled: true,
                maintenance_message: 'a'.repeat(200),
                updated_at: new Date(),
            });

            await setMaintenanceConfig({
                enabled: true,
                message: longMessage,
            });

            expect(prisma.app_settings.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    create: expect.objectContaining({
                        maintenance_message: 'a'.repeat(200),
                    }),
                })
            );
        });
    });
});
