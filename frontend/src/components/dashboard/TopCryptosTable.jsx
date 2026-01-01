"use client";
import { useEffect, useState } from "react";
import CryptoRow from "./CryptoRow";

export default function TopCryptosTable() {
    const [cryptos, setCryptos] = useState([]);
    const [loading, setLoading] = useState(true);

    const logoMap = {
        // Top cryptos
        btc: "bitcoin",
        eth: "ethereum",
        usdt: "tether",
        xrp: "xrp",
        bnb: "binancecoin",
        ada: "cardano",
        sol: "solana",
        dot: "polkadot",
        // Additional cryptos from top 20
        usdc: "usd-coin",
        trx: "tron",
        doge: "dogecoin",
        steth: "staked-ether",
        bch: "bitcoin-cash",
        wbtc: "wrapped-bitcoin",
        wsteth: "wrapped-steth",
        wbeth: "wrapped-beacon-eth",
        weeth: "wrapped-eeth",
        usds: "usds",
        wbt: "whitebit",
        // Stablecoins
        "bsc-usd": "binance-usd",
        busd: "binance-usd",
        dai: "multi-collateral-dai",
        // Other popular cryptos
        avax: "avalanche",
        matic: "polygon",
        shib: "shiba-inu",
        link: "chainlink",
        ltc: "litecoin",
        uni: "uniswap",
        atom: "cosmos",
        xlm: "stellar",
        etc: "ethereum-classic",
        xmr: "monero",
        algo: "algorand",
        vet: "vechain",
        icp: "internet-computer",
        fil: "filecoin",
        hbar: "hedera",
        near: "near-protocol",
        apt: "aptos",
        arb: "arbitrum",
        op: "optimism",
        pepe: "pepe",
        sui: "sui",
        ton: "toncoin",
        render: "render",
        inj: "injective",
        imx: "immutable-x",
        kas: "kaspa",
        bonk: "bonk",
        floki: "floki-inu",
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
                    {cryptos.slice(0, 20).map((c, i) => {
                        //  Trouve le slug du logo (sinon fallback générique)
                        const slug = logoMap[c.symbol.toLowerCase()] || c.symbol.toLowerCase();
                        const symbol = c.symbol.toUpperCase();
                        
                        // Utilise CryptoCompare comme source principale (plus fiable)
                        const logoUrl = `https://assets.coincap.io/assets/icons/${c.symbol.toLowerCase()}@2x.png`;

                        return (
                            <CryptoRow
                                key={c.id}
                                crypto={{
                                    id: c.id,
                                    name: c.name,
                                    symbol: c.symbol,
                                    price: c.price_usd,
                                    change: c.change_percent_24h,
                                    logo: logoUrl,
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
