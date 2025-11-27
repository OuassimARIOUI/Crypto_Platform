import {prisma} from "../services/dbService.js";
export async function getAllCryptosController(req, res) {
    try {
        const cryptos = await prisma.cryptos.findMany({
            orderBy: { id: "asc" },
            include: {
                crypto_prices: {
                    orderBy: { fetched_at: "desc" },
                    take: 1
                }
            }
        });

        const formatted = cryptos.map(c => {
            const last = c.crypto_prices?.[0];

            return {
                id: c.id,
                symbol: c.symbol,
                name: c.name,
                logo: `https://cryptoicons.org/api/icon/${c.symbol.toLowerCase()}/200`,

                price: last?.price_usd ?? 0,
                change: last?.change_percent_24h ?? 0,

                sparkline: null
            };
        });

        return res.json(formatted);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Erreur interne serveur" });
    }
}
