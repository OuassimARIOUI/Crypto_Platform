"use client";
import { useEffect, useState } from "react";

export default function DashboardStats() {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        async function loadStats() {
            try {
                const res = await fetch("http://localhost:3004/cryptos");
                const data = await res.json();

                if (!Array.isArray(data) || data.length === 0) return;

                // /cryptos renvoie: { price, change } (et pas crypto_prices[])
                const totalValue = data.reduce((sum, c) => {
                    const price = Number(c?.price ?? 0);
                    return sum + (Number.isFinite(price) ? price : 0);
                }, 0);

                const changes = data
                    .map((c) => Number(c?.change))
                    .filter((v) => Number.isFinite(v));

                const avgChange =
                    changes.length > 0
                        ? changes.reduce((sum, v) => sum + v, 0) / changes.length
                        : 0;

                setStats({
                    totalValue,
                    avgChange,
                    count: data.length,
                });
            } catch (e) {
                console.error("Erreur chargement stats :", e);
            }
        }

        loadStats();
    }, []);

    if (!stats) return <p className="text-white">Chargement...</p>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl p-6 border border-white/10 bg-white/5">
                <p className="text-gray-300 text-base">Total Market Value (sum)</p>
                <p className="text-4xl font-bold">
                    ${stats.totalValue.toLocaleString()}
                </p>
            </div>

            <div className="rounded-xl p-6 border border-white/10 bg-white/5">
                <p className="text-gray-300">Average 24h change</p>
                <p
                    className={`text-4xl font-bold ${
                        stats.avgChange >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                >
                    {stats.avgChange.toFixed(2)}%
                </p>
            </div>

            <div className="rounded-xl p-6 border border-white/10 bg-white/5">
                <p className="text-gray-300">Total Cryptos</p>
                <p className="text-4xl font-bold">{stats.count}</p>
            </div>
        </div>
    );
}
