"use client";
import React, { useState, useEffect } from "react";
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

const SellIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
);

const CoinIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export default function TradingSellCard() {
    const [symbol, setSymbol] = useState("btc");
    const [currentPrice, setCurrentPrice] = useState(null);
    const [holding, setHolding] = useState(0);
    const [sellQty, setSellQty] = useState("");
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [cryptos, setCryptos] = useState([]);
    const [imgError, setImgError] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Load cryptos list
    useEffect(() => {
        fetch("http://localhost:3004/cryptos")
            .then(res => res.json())
            .then(data => setCryptos(data));
    }, []);

    // Load portfolio + prices when symbol changes
    useEffect(() => {
        async function loadData() {
            try {
                const token = Cookies.get("token");
                if (!token) return;

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
                setHolding(holdings[symbol] ?? 0);

                const crypto = cryptos.find(c => c.symbol === symbol);

                if (crypto) {
                    const priceRow = prices.find(p => p.crypto_id === crypto.id);
                    if (priceRow) {
                        setCurrentPrice(Number(priceRow.price_usd));
                    } else {
                        setCurrentPrice(null);
                    }
                }

                setLoading(false);

            } catch (e) {
                console.error("Error SELL load", e);
                setLoading(false);
            }
        }

        if (cryptos.length > 0) loadData();
    }, [symbol, cryptos]);

    useEffect(() => {
        setImgError(false);
    }, [symbol]);

    async function handleSell(e) {
        e.preventDefault();
        setMessage("");
        setSubmitting(true);

        const token = Cookies.get("token");
        if (!token) {
            setMessage("Login required");
            setIsSuccess(false);
            setSubmitting(false);
            return;
        }

        if (!sellQty || sellQty <= 0) {
            setMessage("Invalid quantity");
            setIsSuccess(false);
            setSubmitting(false);
            return;
        }

        if (Number(sellQty) > holding) {
            setMessage("Insufficient holdings");
            setIsSuccess(false);
            setSubmitting(false);
            return;
        }

        try {
            const res = await fetch("http://localhost:3004/portfolio/sell", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    symbol,
                    quantity: Number(sellQty),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.error || "Sale failed");
                setIsSuccess(false);
                setSubmitting(false);
                return;
            }

            const proceeds = Number(sellQty) * (currentPrice || 0);
            setHolding(prev => prev - Number(sellQty));
            setMessage(`Successfully sold ${Number(sellQty).toFixed(6)} ${symbol.toUpperCase()} for $${proceeds.toFixed(2)}`);
            setIsSuccess(true);
            setSellQty("");

        } catch (err) {
            console.error(err);
            setMessage("Server error");
            setIsSuccess(false);
        } finally {
            setSubmitting(false);
        }
    }

    const quickPercentages = [25, 50, 75, 100];
    const estimatedProceeds = currentPrice && sellQty ? (Number(sellQty) * currentPrice) : 0;
    const logoUrl = cryptoLogos[symbol.toLowerCase()];

    const fallbackIcon = (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500/30 to-red-600/10 flex items-center justify-center text-white font-bold text-xs">
            {symbol.slice(0, 3).toUpperCase()}
        </div>
    );

    return (
        <div className="rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent backdrop-blur-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/30 to-red-500/10 flex items-center justify-center text-red-400">
                        <SellIcon />
                    </div>
                    <div>
                        <h2 className="text-white text-lg font-bold">Sell Crypto</h2>
                        <p className="text-gray-400 text-sm">Sell at market price</p>
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
                    <form className="space-y-5" onSubmit={handleSell}>
                        {/* Crypto Selector */}
                        <div>
                            <label className="block text-gray-400 text-xs mb-2 uppercase tracking-wider">
                                Select Cryptocurrency
                            </label>
                            <div className="relative">
                                <select
                                    className="w-full appearance-none px-4 py-3 rounded-xl bg-black/30 text-white border border-white/10 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/25 transition-colors cursor-pointer"
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

                        {/* Holdings display */}
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <CoinIcon />
                                    <span className="text-sm">Available to sell</span>
                                </div>
                                <p className="text-white font-bold text-lg">
                                    {holding.toFixed(6)} <span className="text-gray-400 text-sm">{symbol.toUpperCase()}</span>
                                </p>
                            </div>
                            {currentPrice && (
                                <p className="text-gray-500 text-xs text-right mt-1">
                                    ≈ ${(holding * currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            )}
                        </div>

                        {/* Quantity Input */}
                        <div>
                            <label className="block text-gray-400 text-xs mb-2 uppercase tracking-wider">
                                Quantity to Sell
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.000001"
                                max={holding}
                                className="w-full px-4 py-3 rounded-xl bg-black/30 text-white text-lg border border-white/10 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/25 transition-colors placeholder:text-gray-500"
                                placeholder="0.000000"
                                value={sellQty}
                                onChange={(e) => setSellQty(e.target.value)}
                            />
                            {/* Quick percentages */}
                            <div className="flex gap-2 mt-2">
                                {quickPercentages.map((pct) => (
                                    <button
                                        key={pct}
                                        type="button"
                                        onClick={() => setSellQty((holding * pct / 100).toString())}
                                        className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                                            Number(sellQty) === holding * pct / 100
                                                ? "border-red-500 bg-red-500/20 text-red-400"
                                                : "border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
                                        }`}
                                    >
                                        {pct}%
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Estimated proceeds */}
                        {estimatedProceeds > 0 && (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                                <p className="text-gray-400 text-xs mb-1">You will receive approximately</p>
                                <p className="text-red-400 text-xl font-bold">
                                    ${estimatedProceeds.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        )}

                        {/* Price info */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                            <span className="text-gray-400 text-sm">Current Price</span>
                            <span className="text-white font-semibold">
                                {currentPrice ? `$${currentPrice.toLocaleString()}` : "-"}
                            </span>
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
                            disabled={submitting || !sellQty || Number(sellQty) <= 0 || Number(sellQty) > holding}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-lg hover:from-red-400 hover:to-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
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
                                    <SellIcon />
                                    <span>Sell {symbol.toUpperCase()}</span>
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
