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

    const row = await prisma.app_settings.upsert({
        where: { key: GLOBAL_SETTINGS_KEY },
        create: { key: GLOBAL_SETTINGS_KEY },
        update: {},
    });

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

    const updated = await prisma.app_settings.upsert({
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

    cachedMaintenance = {
        enabled: Boolean(updated.maintenance_enabled),
        message: updated.maintenance_message ?? null,
        updatedAt: updated.updated_at,
    };
    cacheExpiresAt = Date.now() + CACHE_TTL_MS;

    return cachedMaintenance;
}
