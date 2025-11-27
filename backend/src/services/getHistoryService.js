import { prisma } from "./dbService.js";

export async function getHistoryService(symbol, timeframe = "24h") {

    const crypto = await prisma.cryptos.findUnique({
        where: { symbol: symbol.toLowerCase() }
    });

    if (!crypto) return [];

    const hours = {
        "24h": 24,
        "7d": 24 * 7,
        "1m": 24 * 30,
        "6m": 24 * 180,
        "1y": 24 * 365,
    }[timeframe] || 24;

    const prices = await prisma.crypto_prices.findMany({
        where: { crypto_id: crypto.id },
        orderBy: { fetched_at: "asc" },
        take: hours,
    });

    return prices.map(p => ({
        time: p.fetched_at,
        price: Number(p.price_usd),
    }));
}
