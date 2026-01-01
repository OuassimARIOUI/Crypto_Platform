"use client";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";

// Map des logos crypto
const cryptoLogos = {
    btc: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
    eth: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    bnb: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
    xrp: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
    ada: "https://assets.coingecko.com/coins/images/975/small/cardano.png",
    doge: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
    sol: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
    dot: "https://assets.coingecko.com/coins/images/12171/small/polkadot.png",
    matic: "https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png",
    ltc: "https://assets.coingecko.com/coins/images/2/small/litecoin.png",
    shib: "https://assets.coingecko.com/coins/images/11939/small/shiba.png",
    avax: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
    link: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png",
    atom: "https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png",
    uni: "https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png",
    etc: "https://assets.coingecko.com/coins/images/453/small/ethereum-classic-logo.png",
    xlm: "https://assets.coingecko.com/coins/images/100/small/Stellar_symbol_black_RGB.png",
    bch: "https://assets.coingecko.com/coins/images/780/small/bitcoin-cash-circle.png",
    algo: "https://assets.coingecko.com/coins/images/4380/small/download.png",
    vet: "https://assets.coingecko.com/coins/images/1167/small/VeChain-Logo-768x725.png",
    usdt: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
    usdc: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png",
    trx: "https://assets.coingecko.com/coins/images/1094/small/tron-logo.png",
    near: "https://assets.coingecko.com/coins/images/10365/small/near.jpg",
    ftm: "https://assets.coingecko.com/coins/images/4001/small/Fantom_round.png",
    aave: "https://assets.coingecko.com/coins/images/12645/small/AAVE.png",
    pepe: "https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg",
    arb: "https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg",
    op: "https://assets.coingecko.com/coins/images/25244/small/Optimism.png",
};

// Couleurs de fond pour les fallbacks
const symbolColors = {
    btc: "from-orange-500/30 to-orange-600/10",
    eth: "from-purple-500/30 to-purple-600/10",
    bnb: "from-yellow-500/30 to-yellow-600/10",
    xrp: "from-gray-400/30 to-gray-500/10",
    sol: "from-gradient-500/30 to-purple-600/10",
    doge: "from-yellow-400/30 to-yellow-500/10",
};

const ArrowUpIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
);

const ArrowDownIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
);

// Composant pour une card d'asset individuel
function AssetCard({ asset }) {
    const [imgError, setImgError] = useState(false);
    const symbolLower = asset.symbol.toLowerCase();
    const logoUrl = cryptoLogos[symbolLower];
    const bgColor = symbolColors[symbolLower] || "from-primary/30 to-primary/10";

    const fallbackIcon = (
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${bgColor} flex items-center justify-center text-white font-bold text-sm`}>
            {asset.symbol.slice(0, 3).toUpperCase()}
        </div>
    );

    return (
        <div className="group relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm p-5 hover:border-primary/30 transition-all duration-300">
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative">
                {/* Header avec icon et nom */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {imgError || !logoUrl ? fallbackIcon : (
                            <img
                                src={logoUrl}
                                alt={asset.symbol}
                                className="w-12 h-12 rounded-full"
                                onError={() => setImgError(true)}
                            />
                        )}
                        <div>
                            <h3 className="text-white font-semibold text-lg">{asset.name}</h3>
                            <p className="text-gray-400 text-sm">{asset.symbol.toUpperCase()}</p>
                        </div>
                    </div>

                    {/* Badge de variation */}
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${
                        asset.variation >= 0 
                            ? "bg-green-500/20 text-green-400" 
                            : "bg-red-500/20 text-red-400"
                    }`}>
                        {asset.variation >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
                        {Math.abs(asset.variation).toFixed(2)}%
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                    <div>
                        <p className="text-gray-400 text-xs mb-1">Holdings</p>
                        <p className="text-white font-medium">
                            {asset.holding.toLocaleString(undefined, { maximumFractionDigits: 6 })} 
                            <span className="text-gray-500 text-sm ml-1">{asset.symbol.toUpperCase()}</span>
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs mb-1">Price</p>
                        <p className="text-white font-medium">
                            ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                {/* Total Value - prominent */}
                <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                        <p className="text-gray-400 text-sm">Total Value</p>
                        <p className="text-white text-xl font-bold">
                            ${asset.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Composant pour l'état vide
function EmptyState() {
    return (
        <div className="rounded-2xl border border-white/10 border-dashed bg-white/5 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">No Assets Yet</h3>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">
                Start building your portfolio by purchasing your first cryptocurrency on the Market page.
            </p>
        </div>
    );
}

// Squelette de chargement
function LoadingSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5 animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-white/10" />
                        <div className="flex-1">
                            <div className="h-5 w-24 bg-white/10 rounded mb-2" />
                            <div className="h-4 w-12 bg-white/10 rounded" />
                        </div>
                        <div className="h-6 w-16 bg-white/10 rounded-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                        <div>
                            <div className="h-3 w-16 bg-white/10 rounded mb-2" />
                            <div className="h-5 w-20 bg-white/10 rounded" />
                        </div>
                        <div>
                            <div className="h-3 w-16 bg-white/10 rounded mb-2" />
                            <div className="h-5 w-20 bg-white/10 rounded" />
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between">
                        <div className="h-4 w-20 bg-white/10 rounded" />
                        <div className="h-6 w-28 bg-white/10 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function PortfolioAssets() {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState("grid"); // grid ou list

    useEffect(() => {
        async function loadAssets() {
            try {
                const token = Cookies.get("token");
                if (!token) {
                    setError("Utilisateur non connecté");
                    setLoading(false);
                    return;
                }

                const res = await fetch("http://localhost:3004/portfolio/me", {
                    headers: {
                        Authorization: "Bearer " + token,
                    },
                });

                const portfolio = await res.json();

                if (!res.ok) {
                    setError(portfolio.error || "Erreur chargement portefeuille");
                    setLoading(false);
                    return;
                }

                const pricesRes = await fetch("http://localhost:3004/prices");
                const prices = await pricesRes.json();

                const formatted = Object.entries(portfolio.holdings).map(([symbol, qty]) => {
                    const tx = portfolio.transactions.find(
                        (t) => t.crypto?.symbol === symbol
                    );

                    const cryptoId = tx?.crypto_id;
                    const priceRow = prices.find((p) => p.crypto_id === cryptoId);

                    const price = priceRow ? Number(priceRow.price_usd) : 0;
                    const variation = priceRow ? Number(priceRow.change_percent_24h || 0) : 0;

                    return {
                        name: tx?.crypto?.name || symbol.toUpperCase(),
                        symbol,
                        holding: qty,
                        price,
                        variation,
                        total: qty * price,
                    };
                });

                // Trier par valeur totale décroissante
                formatted.sort((a, b) => b.total - a.total);
                setAssets(formatted);
            } catch (err) {
                console.error(err);
                setError("Erreur serveur");
            } finally {
                setLoading(false);
            }
        }

        loadAssets();
    }, []);

    if (loading) return <LoadingSkeleton />;

    if (error) {
        return (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
                <p className="text-red-400">{error}</p>
            </div>
        );
    }

    if (assets.length === 0) return <EmptyState />;

    return (
        <div className="space-y-4">
            {/* Header avec toggle view */}
            <div className="flex items-center justify-between">
                <p className="text-gray-400 text-sm">{assets.length} asset{assets.length > 1 ? 's' : ''} in portfolio</p>
                
                {/* View toggle */}
                <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
                    <button
                        onClick={() => setViewMode("grid")}
                        className={`p-1.5 rounded transition-colors ${viewMode === "grid" ? "bg-primary text-black" : "text-gray-400 hover:text-white"}`}
                        title="Grid view"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={`p-1.5 rounded transition-colors ${viewMode === "list" ? "bg-primary text-black" : "text-gray-400 hover:text-white"}`}
                        title="List view"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Grid View */}
            {viewMode === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {assets.map((asset, idx) => (
                        <AssetCard key={idx} asset={asset} />
                    ))}
                </div>
            )}

            {/* List View */}
            {viewMode === "list" && (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent">
                    <div className="overflow-x-auto">
                        <table className="min-w-[680px] w-full">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs text-gray-400 uppercase tracking-wider">Asset</th>
                                    <th className="px-6 py-4 text-left text-xs text-gray-400 uppercase tracking-wider">Holdings</th>
                                    <th className="px-6 py-4 text-left text-xs text-gray-400 uppercase tracking-wider">Price</th>
                                    <th className="px-6 py-4 text-left text-xs text-gray-400 uppercase tracking-wider">Total Value</th>
                                    <th className="px-6 py-4 text-right text-xs text-gray-400 uppercase tracking-wider">24h</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {assets.map((asset, idx) => (
                                    <AssetRow key={idx} asset={asset} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// Composant pour une ligne dans la vue liste
function AssetRow({ asset }) {
    const [imgError, setImgError] = useState(false);
    const symbolLower = asset.symbol.toLowerCase();
    const logoUrl = cryptoLogos[symbolLower];
    const bgColor = symbolColors[symbolLower] || "from-primary/30 to-primary/10";

    const fallbackIcon = (
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${bgColor} flex items-center justify-center text-white font-bold text-xs`}>
            {asset.symbol.slice(0, 3).toUpperCase()}
        </div>
    );

    return (
        <tr className="hover:bg-white/5 transition-colors">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    {imgError || !logoUrl ? fallbackIcon : (
                        <img
                            src={logoUrl}
                            alt={asset.symbol}
                            className="w-10 h-10 rounded-full"
                            onError={() => setImgError(true)}
                        />
                    )}
                    <div>
                        <p className="text-white font-semibold">{asset.name}</p>
                        <p className="text-gray-400 text-xs">{asset.symbol.toUpperCase()}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 text-gray-300">
                {asset.holding.toLocaleString(undefined, { maximumFractionDigits: 6 })} {asset.symbol.toUpperCase()}
            </td>
            <td className="px-6 py-4 text-gray-300">
                ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
            <td className="px-6 py-4 text-white font-semibold">
                ${asset.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
            <td className="px-6 py-4 text-right">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${
                    asset.variation >= 0 
                        ? "bg-green-500/20 text-green-400" 
                        : "bg-red-500/20 text-red-400"
                }`}>
                    {asset.variation >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
                    {Math.abs(asset.variation).toFixed(2)}%
                </span>
            </td>
        </tr>
    );
}