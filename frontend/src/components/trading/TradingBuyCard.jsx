"use client";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";

// Crypto logos map
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

const BuyIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);

const WalletIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
);

const CoinIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export default function TradingBuyCard() {
    const [symbol, setSymbol] = useState("btc");
    const [amountUsd, setAmountUsd] = useState("");
    const [currentPrice, setCurrentPrice] = useState(null);
    const [balance, setBalance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [holding, setHolding] = useState(0);
    const [cryptos, setCryptos] = useState([]);
    const [imgError, setImgError] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const token = Cookies.get("token");
                if (!token) {
                    setLoading(false);
                    return;
                }

                const [portfolioRes, pricesRes] = await Promise.all([
                    fetch("http://localhost:3004/portfolio/me", {
                        credentials: "include",
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch("http://localhost:3004/prices"),
                ]);

                const portfolio = await portfolioRes.json();
                const prices = await pricesRes.json();

                const holdings = portfolio.holdings || {};
                const qty = holdings[symbol] ?? 0;
                setHolding(qty);

                const crypto = cryptos.find(c => c.symbol === symbol);

                if (crypto) {
                    const priceRow = prices.find(p => p.crypto_id === crypto.id);
                    if (priceRow) {
                        setCurrentPrice(Number(priceRow.price_usd));
                    } else {
                        setCurrentPrice(null);
                    }
                } else {
                    setCurrentPrice(null);
                }

                setBalance(portfolio.balance);
                setLoading(false);
            } catch (e) {
                console.error("Error BUY load", e);
                setLoading(false);
            }
        }

        if (cryptos.length > 0) loadData();
    }, [symbol, cryptos]);

    useEffect(() => {
        fetch("http://localhost:3004/cryptos")
            .then(res => res.json())
            .then(data => setCryptos(data));
    }, []);

    useEffect(() => {
        setImgError(false);
    }, [symbol]);

    async function handleBuy(e) {
        e.preventDefault();
        setMessage("");
        setSubmitting(true);

        try {
            const token = Cookies.get("token");
            if (!token) {
                setMessage("Login required");
                setIsSuccess(false);
                setSubmitting(false);
                return;
            }

            if (!currentPrice || !amountUsd) {
                setMessage("Invalid amount or price");
                setIsSuccess(false);
                setSubmitting(false);
                return;
            }

            const quantity = Number(amountUsd) / currentPrice;

            const res = await fetch("http://localhost:3004/portfolio/buy", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    symbol,
                    quantity,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.error || "Purchase failed");
                setIsSuccess(false);
                setSubmitting(false);
                return;
            }

            setBalance(data.balance);
            setHolding(prev => prev + quantity);
            setMessage(`Successfully bought ${quantity.toFixed(6)} ${symbol.toUpperCase()}`);
            setIsSuccess(true);
            setAmountUsd("");
        } catch (err) {
            console.error(err);
            setMessage("Server error");
            setIsSuccess(false);
        } finally {
            setSubmitting(false);
        }
    }

    const quickAmounts = [50, 100, 250, 500];
    const estimatedQty = currentPrice && amountUsd ? (Number(amountUsd) / currentPrice) : 0;
    const logoUrl = cryptoLogos[symbol.toLowerCase()];

    const fallbackIcon = (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500/30 to-green-600/10 flex items-center justify-center text-white font-bold text-xs">
            {symbol.slice(0, 3).toUpperCase()}
        </div>
    );

    return (
        <div className="rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent backdrop-blur-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/30 to-green-500/10 flex items-center justify-center text-green-400">
                        <BuyIcon />
                    </div>
                    <div>
                        <h2 className="text-white text-lg font-bold">Buy Crypto</h2>
                        <p className="text-gray-400 text-sm">Purchase at market price</p>
                    </div>
                </div>
                {/* Selected crypto badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                    {imgError || !logoUrl ? fallbackIcon : (
                        <img src={logoUrl} alt={symbol} className="w-5 h-5 rounded-full" onError={() => setImgError(true)} />
                    )}
                    <span className="text-white font-medium text-sm">{symbol.toUpperCase()}</span>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        <div className="h-12 bg-white/10 rounded-xl" />
                        <div className="h-12 bg-white/10 rounded-xl" />
                        <div className="h-12 bg-white/10 rounded-xl" />
                    </div>
                ) : (
                    <form className="space-y-5" onSubmit={handleBuy}>
                        {/* Crypto Selector */}
                        <div>
                            <label className="block text-gray-400 text-xs mb-2 uppercase tracking-wider">
                                Select Cryptocurrency
                            </label>
                            <div className="relative">
                                <select
                                    className="w-full appearance-none px-4 py-3 rounded-xl bg-black/30 text-white border border-white/10 focus:border-green-500/50 focus:ring-1 focus:ring-green-500/25 transition-colors cursor-pointer"
                                    value={symbol}
                                    onChange={(e) => setSymbol(e.target.value)}
                                >
                                    {cryptos.map(c => (
                                        <option key={c.id} value={c.symbol} className="bg-[#0d1117]">
                                            {c.name} ({c.symbol.toUpperCase()})
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div>
                            <label className="block text-gray-400 text-xs mb-2 uppercase tracking-wider">
                                Amount (USD)
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <span className="text-gray-400 text-lg">$</span>
                                </div>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-black/30 text-white text-lg border border-white/10 focus:border-green-500/50 focus:ring-1 focus:ring-green-500/25 transition-colors placeholder:text-gray-500"
                                    placeholder="0.00"
                                    value={amountUsd}
                                    onChange={(e) => setAmountUsd(e.target.value)}
                                />
                            </div>
                            {/* Quick amounts */}
                            <div className="flex gap-2 mt-2">
                                {quickAmounts.map((amt) => (
                                    <button
                                        key={amt}
                                        type="button"
                                        onClick={() => setAmountUsd(amt.toString())}
                                        className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                                            amountUsd === amt.toString()
                                                ? "border-green-500 bg-green-500/20 text-green-400"
                                                : "border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
                                        }`}
                                    >
                                        ${amt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Estimated output */}
                        {estimatedQty > 0 && (
                            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                                <p className="text-gray-400 text-xs mb-1">You will receive approximately</p>
                                <p className="text-green-400 text-xl font-bold">
                                    {estimatedQty.toFixed(6)} {symbol.toUpperCase()}
                                </p>
                            </div>
                        )}

                        {/* Info cards */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                                    <WalletIcon />
                                    <span>Balance</span>
                                </div>
                                <p className="text-white font-semibold">
                                    ${balance !== null ? balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                                    <CoinIcon />
                                    <span>Holdings</span>
                                </div>
                                <p className="text-white font-semibold truncate">
                                    {holding.toFixed(4)} {symbol.toUpperCase()}
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                <p className="text-gray-400 text-xs mb-1">Price</p>
                                <p className="text-white font-semibold">
                                    {currentPrice ? `$${currentPrice.toLocaleString()}` : "-"}
                                </p>
                            </div>
                        </div>

                        {/* Message */}
                        {message && (
                            <div className={`px-4 py-3 rounded-xl flex items-center gap-2 ${
                                isSuccess 
                                    ? "bg-green-500/10 border border-green-500/30 text-green-400" 
                                    : "bg-red-500/10 border border-red-500/30 text-red-400"
                            }`}>
                                {isSuccess ? (
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                                <span className="text-sm">{message}</span>
                            </div>
                        )}

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={submitting || !amountUsd || Number(amountUsd) <= 0}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg hover:from-green-400 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                        >
                            {submitting ? (
                                <>
                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <BuyIcon />
                                    <span>Buy {symbol.toUpperCase()}</span>
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
