"use client";
import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";

// Icons pour les stats
const WalletIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
);

const TrendUpIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const ChartIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const CoinsIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export default function PortfolioStats() {
    const [stats, setStats] = useState({
        totalValue: 0,
        todayProfit: 0,
        totalProfit: 0,
        totalProfitPct: 0,
        assetsCount: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const token = Cookies.get("token");
                if (!token) return;

                const pRes = await fetch("http://localhost:3004/portfolio/me", {
                    headers: { Authorization: "Bearer " + token }
                });
                const portfolio = await pRes.json();

                const pricesRes = await fetch("http://localhost:3004/prices");
                const prices = await pricesRes.json();

                let totalValue = 0;
                let todayProfit = 0;

                const txs = Array.isArray(portfolio.transactions)
                    ? [...portfolio.transactions].sort(
                        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                    )
                    : [];

                const positions = new Map();
                let realizedProfit = 0;
                let totalBuyCost = 0;

                for (const t of txs) {
                    const symbol = String(t.crypto?.symbol || "");
                    if (!symbol) continue;

                    const qty = Number(t.quantity);
                    const px = Number(t.price_usd);
                    if (!Number.isFinite(qty) || !Number.isFinite(px) || qty <= 0) continue;

                    const key = symbol;
                    const pos = positions.get(key) || { qty: 0, cost: 0 };

                    if (t.type === "buy") {
                        pos.qty += qty;
                        pos.cost += qty * px;
                        totalBuyCost += qty * px;
                    } else if (t.type === "sell") {
                        const sellQty = Math.min(qty, pos.qty);
                        const avgCost = pos.qty > 0 ? pos.cost / pos.qty : 0;
                        const costRemoved = sellQty * avgCost;
                        const proceeds = sellQty * px;

                        pos.qty -= sellQty;
                        pos.cost = Math.max(0, pos.cost - costRemoved);
                        realizedProfit += proceeds - costRemoved;
                    }

                    positions.set(key, pos);
                }

                let unrealizedProfit = 0;
                const assetsCount = Object.keys(portfolio.holdings || {}).length;

                for (const [symbol, qty] of Object.entries(portfolio.holdings)) {
                    const tx = portfolio.transactions.find(
                        t => t.crypto?.symbol === symbol
                    );
                    if (!tx) continue;

                    const cryptoId = tx.crypto_id;
                    const priceRow = prices.find(p => p.crypto_id === cryptoId);

                    if (!priceRow) continue;

                    const price = Number(priceRow.price_usd);
                    const variation = Number(priceRow.change_percent_24h || 0);
                    const value = qty * price;

                    totalValue += value;
                    todayProfit += value * (variation / 100);

                    const pos = positions.get(String(symbol)) || { qty: 0, cost: 0 };
                    const currentQty = Number(qty);
                    if (Number.isFinite(currentQty) && currentQty > 0) {
                        const costBasis = Number(pos.cost) || 0;
                        unrealizedProfit += value - costBasis;
                    }
                }

                const totalProfit = realizedProfit + unrealizedProfit;
                const totalProfitPct = totalBuyCost > 0 ? (totalProfit / totalBuyCost) * 100 : 0;

                setStats({
                    totalValue,
                    todayProfit,
                    totalProfit,
                    totalProfitPct,
                    assetsCount,
                });

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-2xl p-6 border border-white/10 bg-white/5 animate-pulse">
                        <div className="h-10 w-10 rounded-xl bg-white/10 mb-4" />
                        <div className="h-4 w-24 bg-white/10 rounded mb-2" />
                        <div className="h-8 w-32 bg-white/10 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    const statsCards = [
        {
            label: "Total Portfolio Value",
            value: `$${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            change: stats.todayProfit,
            changeLabel: "today",
            icon: WalletIcon,
            iconBg: "from-primary/30 to-primary/10",
            iconColor: "text-primary",
        },
        {
            label: "Today's Profit",
            value: `$${Math.abs(stats.todayProfit).toFixed(2)}`,
            change: stats.todayProfit,
            changeLabel: `${(stats.todayProfit / (stats.totalValue || 1) * 100).toFixed(2)}%`,
            icon: TrendUpIcon,
            iconBg: stats.todayProfit >= 0 ? "from-green-500/30 to-green-500/10" : "from-red-500/30 to-red-500/10",
            iconColor: stats.todayProfit >= 0 ? "text-green-400" : "text-red-400",
        },
        {
            label: "Total Profit",
            value: `$${Math.abs(stats.totalProfit).toFixed(2)}`,
            change: stats.totalProfit,
            changeLabel: `${stats.totalProfitPct >= 0 ? "+" : ""}${stats.totalProfitPct.toFixed(2)}%`,
            icon: ChartIcon,
            iconBg: stats.totalProfit >= 0 ? "from-green-500/30 to-green-500/10" : "from-red-500/30 to-red-500/10",
            iconColor: stats.totalProfit >= 0 ? "text-green-400" : "text-red-400",
        },
        {
            label: "Assets Held",
            value: stats.assetsCount.toString(),
            change: null,
            changeLabel: "cryptocurrencies",
            icon: CoinsIcon,
            iconBg: "from-purple-500/30 to-purple-500/10",
            iconColor: "text-purple-400",
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsCards.map((card, idx) => {
                const Icon = card.icon;
                return (
                    <div
                        key={idx}
                        className="group relative rounded-2xl p-6 border border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm hover:border-primary/30 transition-all duration-300"
                    >
                        {/* Glow effect on hover */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        <div className="relative">
                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.iconBg} flex items-center justify-center mb-4`}>
                                <span className={card.iconColor}>
                                    <Icon />
                                </span>
                            </div>

                            {/* Label */}
                            <p className="text-gray-400 text-sm font-medium mb-1">{card.label}</p>

                            {/* Value */}
                            <p className="text-white text-2xl lg:text-3xl font-bold mb-2">{card.value}</p>

                            {/* Change indicator */}
                            <div className="flex items-center gap-2">
                                {card.change !== null && (
                                    <span className={`text-sm font-medium ${card.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                                        {card.change >= 0 ? "↑" : "↓"}
                                    </span>
                                )}
                                <span className={`text-sm ${card.change !== null ? (card.change >= 0 ? "text-green-400" : "text-red-400") : "text-gray-500"}`}>
                                    {card.changeLabel}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
