"use client";
import { useEffect, useState } from "react";

export default function IndicatorsPanel() {
    const [cryptos, setCryptos] = useState([]);
    const [symbol, setSymbol] = useState("btc");
    const [indicators, setIndicators] = useState(null);
    const [loading, setLoading] = useState(true);

    // Charger la liste des cryptos
    useEffect(() => {
        async function loadCryptos() {
            const res = await fetch("http://localhost:3001/cryptos");
            const data = await res.json();
            setCryptos(data || []);
        }
        loadCryptos();
    }, []);

    // Charger les indicateurs quand le symbole change
    useEffect(() => {
        async function loadIndicators() {
            setLoading(true);
            try {
                const res = await fetch(
                    `http://localhost:3001/indicators/${symbol.toLowerCase()}`
                );
                const data = await res.json();
                setIndicators(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }

        if (symbol) loadIndicators();
    }, [symbol]);

    return (
        <div className="rounded-xl border border-white/10 bg-black/40 p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="text-white text-2xl font-bold">Technical Indicators</p>
                    <p className="text-white/60 text-sm">
                        SMA7, SMA30 & variation 24h basés sur ta base PostgreSQL
                    </p>
                </div>

                <select
                    className="h-10 rounded-lg bg-black/40 border border-white/20 text-white px-3 text-sm"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                >
                    {cryptos.map((c) => (
                        <option key={c.id} value={c.symbol}>
                            {c.name} ({c.symbol.toUpperCase()})
                        </option>
                    ))}
                </select>
            </div>

            {loading ? (
                <p className="text-white">Chargement des indicateurs...</p>
            ) : !indicators ? (
                <p className="text-red-400">Aucun indicateur trouvé.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                        <p className="text-white/60 text-sm">SMA 7 jours</p>
                        <p className="text-white text-2xl font-bold">
                            {indicators.sma7 !== null
                                ? indicators.sma7.toFixed(2) + " $"
                                : "-"}
                        </p>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                        <p className="text-white/60 text-sm">SMA 30 jours</p>
                        <p className="text-white text-2xl font-bold">
                            {indicators.sma30 !== null
                                ? indicators.sma30.toFixed(2) + " $"
                                : "-"}
                        </p>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                        <p className="text-white/60 text-sm">Variation 24h</p>
                        <p
                            className={
                                indicators.variation_24h >= 0
                                    ? "text-green-400 text-2xl font-bold"
                                    : "text-red-400 text-2xl font-bold"
                            }
                        >
                            {indicators.variation_24h !== null
                                ? indicators.variation_24h.toFixed(2) + " %"
                                : "-"}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
