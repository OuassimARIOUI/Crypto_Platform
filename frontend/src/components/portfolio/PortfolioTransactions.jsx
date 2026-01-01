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
    usdt: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
    usdc: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png",
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

const BuyIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);

const SellIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
);

// Squelette de chargement
function LoadingSkeleton() {
    return (
        <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4 animate-pulse">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/10" />
                        <div className="flex-1">
                            <div className="h-4 w-32 bg-white/10 rounded mb-2" />
                            <div className="h-3 w-24 bg-white/10 rounded" />
                        </div>
                        <div className="h-6 w-20 bg-white/10 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// Empty state
function EmptyState() {
    return (
        <div className="rounded-2xl border border-white/10 border-dashed bg-white/5 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">No Transactions Yet</h3>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">
                Your transaction history will appear here once you buy or sell cryptocurrencies.
            </p>
        </div>
    );
}

// Composant pour une transaction
function TransactionCard({ transaction }) {
    const [imgError, setImgError] = useState(false);
    const isBuy = transaction.type === "buy";
    const symbol = transaction.crypto?.symbol?.toLowerCase() || "";
    const logoUrl = cryptoLogos[symbol];
    const bgColor = symbolColors[symbol] || "from-primary/30 to-primary/10";
    const total = Number(transaction.price_usd) * Number(transaction.quantity);

    const fallbackIcon = (
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${bgColor} flex items-center justify-center text-white font-bold text-xs`}>
            {symbol.slice(0, 3).toUpperCase()}
        </div>
    );

    // Formater la date de manière relative
    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="group relative rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm p-4 hover:border-white/20 transition-all duration-300">
            <div className="flex items-center gap-4">
                {/* Icon avec type overlay */}
                <div className="relative">
                    {imgError || !logoUrl ? fallbackIcon : (
                        <img
                            src={logoUrl}
                            alt={symbol}
                            className="w-10 h-10 rounded-full"
                            onError={() => setImgError(true)}
                        />
                    )}
                    {/* Type badge */}
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                        isBuy ? "bg-green-500" : "bg-red-500"
                    }`}>
                        {isBuy ? <BuyIcon /> : <SellIcon />}
                    </div>
                </div>

                {/* Transaction info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            isBuy ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                        }`}>
                            {isBuy ? "BUY" : "SELL"}
                        </span>
                        <span className="text-white font-medium truncate">
                            {transaction.crypto?.name || symbol.toUpperCase()}
                        </span>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">
                        {isBuy ? "+" : "-"}{transaction.quantity} {transaction.crypto?.symbol?.toUpperCase()} 
                        <span className="mx-2">•</span>
                        @ ${Number(transaction.price_usd).toLocaleString()}
                    </p>
                </div>

                {/* Amount & Date */}
                <div className="text-right">
                    <p className={`font-semibold ${isBuy ? "text-green-400" : "text-red-400"}`}>
                        {isBuy ? "-" : "+"}${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                        {formatDate(transaction.timestamp)}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function PortfolioTransactions() {
    const [tx, setTx] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        async function loadTransactions() {
            try {
                const token = Cookies.get("token");
                if (!token) {
                    setError("Utilisateur non connecté");
                    setLoading(false);
                    return;
                }

                const res = await fetch("http://localhost:3004/portfolio/me", {
                    headers: {
                        Authorization: "Bearer " + token
                    }
                });

                const data = await res.json();

                if (!res.ok) {
                    setError(data.error || "Erreur chargement transactions");
                    return;
                }

                // Trier par date décroissante
                const sorted = (data.transactions || []).sort(
                    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
                );
                setTx(sorted);
            } catch (err) {
                console.error(err);
                setError("Erreur serveur");
            } finally {
                setLoading(false);
            }
        }

        loadTransactions();
    }, []);

    if (loading) return <LoadingSkeleton />;

    if (error) {
        return (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
                <p className="text-red-400">{error}</p>
            </div>
        );
    }

    if (tx.length === 0) return <EmptyState />;

    const displayedTx = showAll ? tx : tx.slice(0, 5);
    const hasMore = tx.length > 5;

    return (
        <div className="space-y-3">
            {displayedTx.map((t) => (
                <TransactionCard key={t.id} transaction={t} />
            ))}

            {/* Show more button */}
            {hasMore && (
                <button
                    onClick={() => setShowAll(!showAll)}
                    className="w-full py-3 rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-white/20 transition-colors text-sm font-medium"
                >
                    {showAll ? (
                        <>
                            <span>Show Less</span>
                            <svg className="w-4 h-4 inline ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        </>
                    ) : (
                        <>
                            <span>View All {tx.length} Transactions</span>
                            <svg className="w-4 h-4 inline ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </>
                    )}
                </button>
            )}
        </div>
    );
}