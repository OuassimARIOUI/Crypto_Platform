import { prisma } from "./dbService.js";

const GLOBAL_SETTINGS_KEY = "global";

let cachedMaintenance = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 5000;

function normalizeMessage(message) {
    if (typeof message !== "string") return null;
    const trimmed = message.trim();
    if (!trimmed) return null;
    return trimmed.slice(0, 200);
}

export async function getMaintenanceConfig({ noCache = false } = {}) {
    const now = Date.now();
    if (!noCache && cachedMaintenance && cacheExpiresAt > now) {
        return cachedMaintenance;
    }

    let row;
    try {
        row = await prisma.app_settings.upsert({
            where: { key: GLOBAL_SETTINGS_KEY },
            create: { key: GLOBAL_SETTINGS_KEY },
            update: {},
        });
    } catch (err) {
        // Rare race: two concurrent upserts can collide on unique PK in some environments.
        if (err?.code === "P2002") {
            row = await prisma.app_settings.findUnique({ where: { key: GLOBAL_SETTINGS_KEY } });
        } else {
            throw err;
        }
    }

    if (!row) {
        // Defensive: should not happen unless DB is unavailable.
        row = await prisma.app_settings.create({
            data: { key: GLOBAL_SETTINGS_KEY },
        });
    }

    cachedMaintenance = {
        enabled: Boolean(row.maintenance_enabled),
        message: row.maintenance_message ?? null,
        updatedAt: row.updated_at,
    };
    cacheExpiresAt = now + CACHE_TTL_MS;

    return cachedMaintenance;
}

export async function setMaintenanceConfig({ enabled, message } = {}) {
    if (typeof enabled !== "boolean") {
        throw new Error("enabled must be a boolean");
    }

    let updated;
    try {
        updated = await prisma.app_settings.upsert({
            where: { key: GLOBAL_SETTINGS_KEY },
            create: {
                key: GLOBAL_SETTINGS_KEY,
                maintenance_enabled: enabled,
                maintenance_message: normalizeMessage(message),
            },
            update: {
                maintenance_enabled: enabled,
                maintenance_message: normalizeMessage(message),
            },
        });
    } catch (err) {
        // Same race handling as getMaintenanceConfig.
        if (err?.code === "P2002") {
            updated = await prisma.app_settings.update({
                where: { key: GLOBAL_SETTINGS_KEY },
                data: {
                    maintenance_enabled: enabled,
                    maintenance_message: normalizeMessage(message),
                },
            });
        } else {
            throw err;
        }
    }

    cachedMaintenance = {
        enabled: Boolean(updated.maintenance_enabled),
        message: updated.maintenance_message ?? null,
        updatedAt: updated.updated_at,
    };
    cacheExpiresAt = Date.now() + CACHE_TTL_MS;

    return cachedMaintenance;
}
