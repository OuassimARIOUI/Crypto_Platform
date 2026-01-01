"use client";
import { useEffect, useState } from "react";

export default function DashboardStats() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStats() {
            try {
                const res = await fetch("http://localhost:3004/cryptos");
                const data = await res.json();

                if (!Array.isArray(data) || data.length === 0) {
                    setLoading(false);
                    return;
                }

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

                // Find top gainer and loser
                let topGainer = null;
                let topLoser = null;
                data.forEach(c => {
                    const change = Number(c?.change);
                    if (!Number.isFinite(change)) return;
                    if (!topGainer || change > Number(topGainer.change)) topGainer = c;
                    if (!topLoser || change < Number(topLoser.change)) topLoser = c;
                });

                setStats({
                    totalValue,
                    avgChange,
                    count: data.length,
                    topGainer,
                    topLoser
                });
            } catch (e) {
                console.error("Erreur chargement stats :", e);
            } finally {
                setLoading(false);
            }
        }

        loadStats();
    }, []);

    // Skeleton loading
    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-xl p-5 border border-white/10 bg-white/5 animate-pulse">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-12 w-12 rounded-xl bg-white/10" />
                            <div className="h-4 w-24 bg-white/10 rounded" />
                        </div>
                        <div className="h-8 w-32 bg-white/10 rounded mb-2" />
                        <div className="h-3 w-20 bg-white/10 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                <p className="text-white/60">Unable to load market stats</p>
            </div>
        );
    }

    const statCards = [
        {
            title: "Total Market Value",
            value: `$${stats.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            subtitle: "Combined prices",
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            iconBg: "from-blue-500/30 to-blue-600/20",
            iconBorder: "border-blue-500/30",
            iconColor: "text-blue-400",
            glow: "shadow-blue-500/20"
        },
        {
            title: "Avg 24h Change",
            value: `${stats.avgChange >= 0 ? "+" : ""}${stats.avgChange.toFixed(2)}%`,
            subtitle: "Market trend",
            valueColor: stats.avgChange >= 0 ? "text-green-400" : "text-red-400",
            icon: stats.avgChange >= 0 ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
            ),
            iconBg: stats.avgChange >= 0 ? "from-green-500/30 to-green-600/20" : "from-red-500/30 to-red-600/20",
            iconBorder: stats.avgChange >= 0 ? "border-green-500/30" : "border-red-500/30",
            iconColor: stats.avgChange >= 0 ? "text-green-400" : "text-red-400",
            glow: stats.avgChange >= 0 ? "shadow-green-500/20" : "shadow-red-500/20"
        },
        {
            title: "Top Gainer",
            value: stats.topGainer ? stats.topGainer.symbol.toUpperCase() : "-",
            subtitle: stats.topGainer ? `+${Number(stats.topGainer.change).toFixed(2)}%` : "",
            subtitleColor: "text-green-400",
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
            ),
            iconBg: "from-yellow-500/30 to-orange-500/20",
            iconBorder: "border-yellow-500/30",
            iconColor: "text-yellow-400",
            glow: "shadow-yellow-500/20"
        },
        {
            title: "Total Cryptos",
            value: stats.count.toString(),
            subtitle: "Assets tracked",
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
            iconBg: "from-purple-500/30 to-purple-600/20",
            iconBorder: "border-purple-500/30",
            iconColor: "text-purple-400",
            glow: "shadow-purple-500/20"
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card, index) => (
                <div
                    key={index}
                    className={`group relative rounded-xl p-5 border border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm hover:border-white/20 transition-all duration-300 shadow-lg ${card.glow}`}
                >
                    {/* Subtle glow effect on hover */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="relative">
                        {/* Icon */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${card.iconBg} border ${card.iconBorder} flex items-center justify-center ${card.iconColor}`}>
                                {card.icon}
                            </div>
                            <span className="text-white/60 text-sm font-medium">{card.title}</span>
                        </div>
                        
                        {/* Value */}
                        <p className={`text-3xl font-bold ${card.valueColor || "text-white"} tracking-tight`}>
                            {card.value}
                        </p>
                        
                        {/* Subtitle */}
                        {card.subtitle && (
                            <p className={`text-sm mt-1 ${card.subtitleColor || "text-white/50"}`}>
                                {card.subtitle}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
