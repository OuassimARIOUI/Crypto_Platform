import { prisma } from "./dbService.js";
import { logInfo, logError } from "../utils/logger.js";
import { sendDiscordDM } from "./discordService.js";

export async function checkAlert(symbol, upPercent, downPercent) {

    const crypto = await prisma.cryptos.findUnique({
        where: { symbol }
    });

    if (!crypto) {
        logError("AlertsService : Crypto introuvable :", symbol);
        return null;
    }

    const lastPrice = await prisma.crypto_prices.findFirst({
        where: { crypto_id: crypto.id },
        orderBy: { fetched_at: "desc" }
    });

    if (!lastPrice) {
        logError("AlertsService : Aucune donnée de prix disponible pour :", crypto.name);
        return null;
    }

    const variation = lastPrice.change_percent_24h;

    let AlertTriggered = false;
    let AlertType = null;

    // Check UP alert
    if (variation >= Number(upPercent)) {
        AlertTriggered = true;
        AlertType = `increase_${upPercent}%`;
    }

    // Check DOWN alert
    if (variation <= Number(downPercent)) {
        AlertTriggered = true;
        AlertType = `decrease_${downPercent}%`;
    }

    return {
        symbol,
        price: lastPrice.price_usd,
        variation_24h: variation,
        alert: AlertTriggered,
        alertType: AlertType
    };
}

const ALERT_TYPES = new Set(["PERCENT_UP", "PERCENT_DOWN", "PRICE_ABOVE", "PRICE_BELOW"]);

export async function createAlert({ userId, symbol, type, threshold }) {
    const normalizedSymbol = symbol.toString().trim().toLowerCase();
    const alertType = type.toString().trim().toUpperCase();

    if (!ALERT_TYPES.has(alertType)) {
        throw new Error(`Unsupported alert type: ${alertType}`);
    }

    const crypto = await prisma.cryptos.findUnique({ where: { symbol: normalizedSymbol } });
    if (!crypto) throw new Error("Crypto introuvable");

    const alert = await prisma.alerts.create({
        data: {
            user_id: userId,
            crypto_id: crypto.id,
            alert_type: alertType,
            threshold: threshold,
            is_triggered: false,
            created_at: new Date(),
        },
    });

    return alert;
}

export async function listMyAlerts(userId) {
    return prisma.alerts.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        include: {
            cryptos: true,
        },
    });
}

export async function deleteMyAlert({ userId, alertId }) {
    const existing = await prisma.alerts.findFirst({
        where: { id: alertId, user_id: userId },
    });
    if (!existing) throw new Error("Alert not found");
    await prisma.alerts.delete({ where: { id: alertId } });
}

export async function resetMyAlert({ userId, alertId }) {
    const existing = await prisma.alerts.findFirst({
        where: { id: alertId, user_id: userId },
    });
    if (!existing) throw new Error("Alert not found");

    return prisma.alerts.update({
        where: { id: alertId },
        data: {
            is_triggered: false,
            triggered_at: null,
        },
    });
}

function isTriggered(alertType, threshold, latestPrice) {
    const priceUsd = Number(latestPrice.price_usd);
    const change24h = latestPrice.change_percent_24h === null || latestPrice.change_percent_24h === undefined
        ? null
        : Number(latestPrice.change_percent_24h);

    const t = Number(threshold);

    if (alertType === "PRICE_ABOVE") return priceUsd >= t;
    if (alertType === "PRICE_BELOW") return priceUsd <= t;
    if (alertType === "PERCENT_UP") return change24h !== null && change24h >= t;
    if (alertType === "PERCENT_DOWN") return change24h !== null && change24h <= t;

    return false;
}

function buildAlertMessage({ user, alert, crypto, latestPrice }) {
    const priceUsd = Number(latestPrice.price_usd);
    const change24h = latestPrice.change_percent_24h === null || latestPrice.change_percent_24h === undefined
        ? null
        : Number(latestPrice.change_percent_24h);

    const symbol = crypto.symbol.toUpperCase();
    const threshold = Number(alert.threshold);

    let condition = `${alert.alert_type} ${threshold}`;
    if (alert.alert_type === "PRICE_ABOVE") condition = `price >= ${threshold}`;
    if (alert.alert_type === "PRICE_BELOW") condition = `price <= ${threshold}`;
    if (alert.alert_type === "PERCENT_UP") condition = `24h change >= ${threshold}%`;
    if (alert.alert_type === "PERCENT_DOWN") condition = `24h change <= ${threshold}%`;

    const parts = [
        `Crypto alert triggered for ${symbol}`,
        `Condition: ${condition}`,
        `Current price: $${priceUsd.toFixed(6)}`,
    ];

    if (change24h !== null) {
        parts.push(`24h change: ${change24h.toFixed(2)}%`);
    }

    parts.push(`User: ${user.pseudo}`);
    return parts.join("\n");
}

export async function processPendingAlerts() {
    const pending = await prisma.alerts.findMany({
        where: {
            user_id: { not: null },
            OR: [{ is_triggered: false }, { is_triggered: null }],
        },
        include: {
            cryptos: true,
            user: true,
        },
        orderBy: { created_at: "asc" },
    });

    let eligibleTriggeredCount = 0;
    let triggeredCount = 0;
    let notifiedCount = 0;

    for (const alert of pending) {
        if (!alert.user || !alert.cryptos) continue;

        const latestPrice = await prisma.crypto_prices.findFirst({
            where: { crypto_id: alert.crypto_id },
            orderBy: { fetched_at: "desc" },
        });

        if (!latestPrice) continue;

        const didTrigger = isTriggered(alert.alert_type, alert.threshold, latestPrice);
        if (!didTrigger) continue;

        eligibleTriggeredCount++;

        const discordUserId = alert.user.discord_user_id;
        if (!discordUserId) {
            logInfo(
                `Alert eligible but Discord not connected: alertId=${alert.id} userId=${alert.user.id} crypto=${alert.cryptos.symbol}`
            );
            continue;
        }

        try {
            const message = buildAlertMessage({
                user: alert.user,
                alert,
                crypto: alert.cryptos,
                latestPrice,
            });

            await sendDiscordDM(discordUserId, message);

            // Mark triggered only after successful notification
            await prisma.alerts.update({
                where: { id: alert.id },
                data: {
                    is_triggered: true,
                    triggered_at: new Date(),
                },
            });

            notifiedCount++;
            triggeredCount++;
        } catch (err) {
            logError(
                `Discord notification failed: alertId=${alert.id} userId=${alert.user.id} discordUserId=${discordUserId}`,
                err?.message || err
            );
        }
    }

    logInfo(
        `Alerts processed: pending=${pending.length} eligible=${eligibleTriggeredCount} triggered=${triggeredCount} notified=${notifiedCount}`
    );
    return { pending: pending.length, eligible: eligibleTriggeredCount, triggered: triggeredCount, notified: notifiedCount };
}
