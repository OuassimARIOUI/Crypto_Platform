"use client";
import { useEffect, useState } from "react";
import CryptoRow from "./CryptoRow";

export default function TopCryptosTable() {
    const [cryptos, setCryptos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState("rank"); // rank, price, change
    const [sortOrder, setSortOrder] = useState("asc");

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
                        .filter(p => p.crypto_id === c.id)
                        .sort((a, b) => new Date(b.fetched_at) - new Date(a.fetched_at))[0];

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

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(column);
            setSortOrder(column === "rank" ? "asc" : "desc");
        }
    };

    const getSortedCryptos = () => {
        const sorted = [...cryptos].slice(0, 20);
        
        if (sortBy === "price") {
            sorted.sort((a, b) => sortOrder === "asc" ? a.price_usd - b.price_usd : b.price_usd - a.price_usd);
        } else if (sortBy === "change") {
            sorted.sort((a, b) => sortOrder === "asc" ? a.change_percent_24h - b.change_percent_24h : b.change_percent_24h - a.change_percent_24h);
        }
        
        return sorted;
    };

    const SortIcon = ({ column }) => {
        if (sortBy !== column) {
            return (
                <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            );
        }
        return sortOrder === "asc" ? (
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
        ) : (
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        );
    };

    // Skeleton loading
    if (loading) {
        return (
            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-lg overflow-hidden">
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
                        <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
                    </div>
                </div>
                <div className="divide-y divide-white/5">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="px-4 py-4 flex items-center gap-4 animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-white/10" />
                            <div className="flex-1">
                                <div className="h-4 w-24 bg-white/10 rounded mb-2" />
                                <div className="h-3 w-16 bg-white/10 rounded" />
                            </div>
                            <div className="h-4 w-20 bg-white/10 rounded" />
                            <div className="h-4 w-16 bg-white/10 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const sortedCryptos = getSortedCryptos();

    return (
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-lg overflow-hidden">
            {/* Table Header */}
            <div className="hidden sm:grid sm:grid-cols-[60px_1fr_140px_120px_100px] gap-4 px-4 py-3 border-b border-white/10 bg-white/5">
                <button 
                    onClick={() => handleSort("rank")}
                    className="flex items-center gap-1 text-xs font-semibold text-white/60 uppercase tracking-wider hover:text-white transition-colors"
                >
                    Rank
                    <SortIcon column="rank" />
                </button>
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Name</span>
                <button 
                    onClick={() => handleSort("price")}
                    className="flex items-center gap-1 text-xs font-semibold text-white/60 uppercase tracking-wider hover:text-white transition-colors text-right justify-end"
                >
                    Price
                    <SortIcon column="price" />
                </button>
                <button 
                    onClick={() => handleSort("change")}
                    className="flex items-center gap-1 text-xs font-semibold text-white/60 uppercase tracking-wider hover:text-white transition-colors text-right justify-end"
                >
                    24h %
                    <SortIcon column="change" />
                </button>
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider text-right">Action</span>
            </div>

            {/* Mobile Header */}
            <div className="sm:hidden flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                    {sortedCryptos.length} Cryptos
                </span>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-white/40">Sort:</span>
                    <select 
                        value={sortBy}
                        onChange={(e) => { setSortBy(e.target.value); setSortOrder(e.target.value === "rank" ? "asc" : "desc"); }}
                        className="text-xs bg-white/10 border border-white/10 rounded px-2 py-1 text-white"
                    >
                        <option value="rank" className="bg-black">Rank</option>
                        <option value="price" className="bg-black">Price</option>
                        <option value="change" className="bg-black">24h Change</option>
                    </select>
                </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-white/5">
                {sortedCryptos.map((c, i) => {
                    const logoUrl = `https://assets.coincap.io/assets/icons/${c.symbol.toLowerCase()}@2x.png`;
                    const originalIndex = cryptos.findIndex(crypto => crypto.id === c.id);

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
                            index={sortBy === "rank" ? i + 1 : originalIndex + 1}
                        />
                    );
                })}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-white/10 bg-white/5 flex items-center justify-between">
                <span className="text-xs text-white/40">
                    Showing top 20 cryptocurrencies
                </span>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-white/60">Live prices</span>
                </div>
            </div>
        </div>
    );
}
