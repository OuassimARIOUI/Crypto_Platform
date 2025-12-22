"use client";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";

export default function PortfolioStats() {
    const [stats, setStats] = useState({
        totalValue: 0,
        todayProfit: 0,
        totalProfit: 0,
        totalProfitPct: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const token = Cookies.get("token");
                if (!token) return;

                // 1) Portfolio (balance, holdings, transactions)
                const pRes = await fetch("http://localhost:3004/portfolio/me", {
                    headers: { Authorization: "Bearer " + token }
                });
                const portfolio = await pRes.json();

                // 2) Latest market prices
                const pricesRes = await fetch("http://localhost:3004/prices");
                const prices = await pricesRes.json();

                // 3) Build total portfolio value
                let totalValue = 0;
                let todayProfit = 0;

                // Total profit = realized + unrealized
                // We approximate cost basis using average cost per crypto.
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
                    // Use holdings qty as the source of truth for current size.
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
                });

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) return <p className="text-white">Chargement...</p>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Total Portfolio Value */}
            <div className="flex flex-col gap-2 rounded-xl p-6 border border-white/10 bg-white/5">
                <p className="text-gray-300 text-base font-medium">Total Portfolio Value</p>
                <p className="text-white text-4xl font-bold">
                    ${stats.totalValue.toLocaleString()}
                </p>
                <p className={stats.todayProfit >= 0 ? "text-green-400" : "text-red-400"}>
                    {stats.todayProfit >= 0 ? "+" : ""}
                    ${stats.todayProfit.toFixed(2)}
                </p>
            </div>

            {/* Today's Profit */}
            <div className="flex flex-col gap-2 rounded-xl p-6 border border-white/10 bg-white/5">
                <p className="text-gray-300 text-base font-medium">Today&apos;s Profit</p>
                <p className="text-white text-4xl font-bold">
                    ${stats.todayProfit.toFixed(2)}
                </p>
                <p className={stats.todayProfit >= 0 ? "text-green-400" : "text-red-400"}>
                    {(stats.todayProfit / (stats.totalValue || 1) * 100).toFixed(2)}%
                </p>
            </div>

            {/* Total Profit (optionnel) */}
            <div className="flex flex-col gap-2 rounded-xl p-6 border border-white/10 bg-white/5">
                <p className="text-gray-300 text-base font-medium">Total Profit</p>
                <p className="text-white text-4xl font-bold">
                    ${stats.totalProfit.toFixed(2)}
                </p>
                <p className={stats.totalProfit >= 0 ? "text-green-400" : "text-red-400"}>
                    {stats.totalProfit >= 0 ? "+" : ""}{stats.totalProfitPct.toFixed(2)}%
                </p>
            </div>

        </div>
    );
}
