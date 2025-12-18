"use client";

import { useEffect, useMemo, useState } from "react";

const TIMEFRAME_BUTTONS = [
    { label: "1H", key: "1h" },
    { label: "4H", key: "4h" },
    { label: "1D", key: "24h" },
    { label: "1W", key: "7d" },
    { label: "1M", key: "1m" },
];

function buildPaths(prices) {
    const width = 472;
    const height = 149;

    if (!prices || prices.length < 2) {
        return { line: "", area: "" };
    }

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const points = prices.map((p, idx) => {
        const x = (idx / (prices.length - 1)) * width;
        const y = height - ((p - min) / range) * height;
        return { x, y };
    });

    const line = points
        .map((pt, idx) => `${idx === 0 ? "M" : "L"}${pt.x} ${pt.y}`)
        .join(" ");

    const area = `${line} V ${height} H 0 Z`;

    return { line, area };
}

export default function TradingHeaderChart() {
    const [timeframe, setTimeframe] = useState("1h");
    const [loading, setLoading] = useState(true);
    const [price, setPrice] = useState(null);
    const [variation, setVariation] = useState(null);
    const [history, setHistory] = useState([]);

    // For now, keep BTC like your example design.
    const symbol = "btc";

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            try {
                // 1) Current price + 24h variation
                const pricesRes = await fetch("http://localhost:3004/prices");
                const prices = await pricesRes.json();

                // find BTC row (API returns crypto_id; btc is usually id=1 but we avoid hardcoding)
                // If backend doesn't include symbol in /prices, use /cryptos to map.
                const [cryptosRes] = await Promise.all([
                    fetch("http://localhost:3004/cryptos"),
                ]);
                const cryptos = await cryptosRes.json();
                const crypto = (cryptos || []).find((c) => c.symbol === symbol);

                const latest = crypto
                    ? (prices || []).find((p) => p.crypto_id === crypto.id)
                    : null;

                // 2) History for chart
                // Backend supports 24h/7d/1m/6m/1y.
                // For 1H/4H we reuse 24h history and slice last points.
                const historyTimeframe = timeframe === "1h" || timeframe === "4h" ? "24h" : timeframe;
                const histRes = await fetch(
                    `http://localhost:3004/prices/history/${symbol}?timeframe=${historyTimeframe}`
                );
                const rawHistory = await histRes.json();

                let series = Array.isArray(rawHistory) ? rawHistory : [];

                if (timeframe === "1h") {
                    series = series.slice(-12);
                }
                if (timeframe === "4h") {
                    series = series.slice(-48);
                }

                if (!cancelled) {
                    setPrice(latest?.price_usd ?? null);
                    setVariation(latest?.change_percent_24h ?? null);
                    setHistory(series);
                }
            } catch {
                if (!cancelled) {
                    setPrice(null);
                    setVariation(null);
                    setHistory([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [timeframe]);

    const pricesOnly = useMemo(() => history.map((p) => Number(p.price)).filter((n) => Number.isFinite(n)), [history]);
    const { line, area } = useMemo(() => buildPaths(pricesOnly), [pricesOnly]);

    const formattedPrice = price !== null && price !== undefined ? `$${Number(price).toLocaleString()}` : "-";
    const formattedVar =
        variation !== null && variation !== undefined
            ? `${Number(variation) >= 0 ? "+" : ""}${Number(variation).toFixed(2)}%`
            : "-";

    return (
        <div className="flex flex-col gap-2 bg-[#182b34] p-6 rounded-xl border border-[#315668]/50">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <p className="text-white text-lg font-medium leading-normal">BTC/USD</p>
                    <div className="flex items-end gap-3">
                        <p className="text-white tracking-light text-[32px] font-bold leading-tight truncate">
                            {loading ? "…" : formattedPrice}
                        </p>
                        <div className="flex gap-2 pb-1">
                            <p className="text-[#90b7cb] text-base font-normal leading-normal">24H</p>
                            <p className={`text-base font-medium leading-normal ${Number(variation) >= 0 ? "text-[#0bda57]" : "text-red-400"}`}>
                                {loading ? "…" : formattedVar}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-start md:justify-end gap-1 bg-[#101d23] p-1 rounded-lg">
                    {TIMEFRAME_BUTTONS.map((b) => (
                        <button
                            key={b.key}
                            onClick={() => setTimeframe(b.key)}
                            className={
                                timeframe === b.key
                                    ? "text-white bg-primary text-sm font-bold leading-normal tracking-[0.015em] py-2 px-4 rounded-md"
                                    : "text-[#90b7cb] hover:text-white text-sm font-bold leading-normal tracking-[0.015em] py-2 px-4 rounded-md transition-colors"
                            }
                        >
                            {b.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex h-[300px] flex-1 flex-col gap-8 py-4">
                <svg
                    fill="none"
                    height="100%"
                    preserveAspectRatio="none"
                    viewBox="-3 0 478 150"
                    width="100%"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {area ? (
                        <path d={area} fill="url(#paint0_linear_chart)" />
                    ) : null}
                    {line ? (
                        <path
                            d={line}
                            stroke="#0da6f2"
                            strokeLinecap="round"
                            strokeWidth="3"
                        />
                    ) : null}
                    <defs>
                        <linearGradient
                            gradientUnits="userSpaceOnUse"
                            id="paint0_linear_chart"
                            x1="236"
                            x2="236"
                            y1="1"
                            y2="149"
                        >
                            <stop stopColor="#0da6f2" stopOpacity="0.3" />
                            <stop offset="1" stopColor="#0da6f2" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
        </div>
    );
}
