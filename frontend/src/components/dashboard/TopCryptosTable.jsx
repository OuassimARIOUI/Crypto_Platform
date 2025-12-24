"use client";
import { useEffect, useState } from "react";
import CryptoRow from "./CryptoRow";

export default function TopCryptosTable() {
    const [cryptos, setCryptos] = useState([]);
    const [loading, setLoading] = useState(true);

    const logoMap = {
        btc: "bitcoin",
        eth: "ethereum",
        usdt: "tether",
        xrp: "xrp",
        bnb: "binance-coin",
        ada: "cardano",
        sol: "solana",
        dot: "polkadot",
    };

    useEffect(() => {
        async function loadCryptos() {
            try {
                const [cryptosRes, pricesRes] = await Promise.all([
                    fetch("http://localhost:3004/cryptos"),
                    fetch("http://localhost:3004/prices"),
                ]);

                const cryptosData = await cryptosRes.json();
                const pricesData = await pricesRes.json();

                // Fusion des prix
                const merged = cryptosData.map(c => {
                    const lastPrice = pricesData
                        .filter(p => p.crypto_id === c.id)       // prix de cette crypto
                        .sort((a, b) => new Date(b.fetched_at) - new Date(a.fetched_at))[0]; // dernier prix

                    return {
                        ...c,
                        price_usd: lastPrice?.price_usd || 0,
                        change_percent_24h: lastPrice?.change_percent_24h || 0,
                    };
                });

                setCryptos(merged);
            } catch (err) {
                console.error("Erreur chargement cryptos :", err);
            } finally {
                setLoading(false);
            }
        }

        loadCryptos();
    }, []);


    if (loading) return <p className="text-white">Chargement...</p>;

    return (
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-[520px] w-full">
                    <thead>
                        <tr className="border-b border-white/10 text-gray-400 text-xs uppercase">
                            <th className="px-3 sm:px-4 py-3">#</th>
                            <th className="px-3 sm:px-4 py-3">Name</th>
                            <th className="px-3 sm:px-4 py-3">Price</th>
                            <th className="px-3 sm:px-4 py-3">24h %</th>
                        </tr>
                    </thead>

                    <tbody>
                    {cryptos.map((c, i) => {
                        //  Trouve le slug du logo (sinon fallback générique)
                        const slug = logoMap[c.symbol.toLowerCase()] || c.symbol.toLowerCase();

                        return (
                            <CryptoRow
                                key={c.id}
                                crypto={{
                                    id: c.id,
                                    name: c.name,
                                    symbol: c.symbol,
                                    price: c.price_usd,
                                    change: c.change_percent_24h,
                                    logo: `https://cryptologos.cc/logos/${slug}-${c.symbol.toLowerCase()}-logo.png`,
                                }}
                                index={i + 1}
                            />
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
