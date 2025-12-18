"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

export default function IndicatorsPanel() {
    const [cryptos, setCryptos] = useState([]);
    const [symbol, setSymbol] = useState("btc");
    const [timeframe, setTimeframe] = useState("24h");

    const [price, setPrice] = useState(null);
    const [variation, setVariation] = useState(null);
    const [indicators, setIndicators] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [smaVisible, setSmaVisible] = useState({ sma7: true, sma30: true });

    const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

    function formatXAxisLabel(timeframe, ts) {
        if (!ts) return "";

        const date = new Date(ts);
        if (Number.isNaN(date.getTime())) return "";

        const locale = "fr-FR";

        if (timeframe === "24h") {
            return new Intl.DateTimeFormat(locale, {
                hour: "2-digit",
                minute: "2-digit",
            }).format(date);
        }

        if (timeframe === "7d" || timeframe === "1m") {
            return new Intl.DateTimeFormat(locale, {
                day: "2-digit",
                month: "short",
            }).format(date);
        }

        if (timeframe === "6m") {
            return new Intl.DateTimeFormat(locale, {
                month: "short",
            }).format(date);
        }

        if (timeframe === "1y") {
            return new Intl.DateTimeFormat(locale, {
                month: "short",
                year: "2-digit",
            }).format(date);
        }

        return new Intl.DateTimeFormat(locale, {
            day: "2-digit",
            month: "short",
        }).format(date);
    }

    function filterTimeframe(data, timeframe) {
        const now = new Date();
        const cutoff = new Date();

        if (timeframe === "6m") cutoff.setMonth(cutoff.getMonth() - 6);
        if (timeframe === "1y") cutoff.setFullYear(cutoff.getFullYear() - 1);

        if (!["6m", "1y"].includes(timeframe)) return data;
        return data.filter(p => new Date(p.time) >= cutoff);
    }

    useEffect(() => {
        fetch("http://localhost:3004/cryptos")
            .then(res => res.json())
            .then(data => setCryptos(data || []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (cryptos.length === 0) return;

        async function loadData() {
            setLoading(true);

            try {
                const priceRes = await fetch("http://localhost:3004/prices");
                const priceData = await priceRes.json();

                const crypto = cryptos.find(c => c.symbol === symbol);

                const latest = priceData
                    .filter(p => p.crypto_id === crypto?.id)
                    .sort((a, b) => new Date(b.fetched_at) - new Date(a.fetched_at))[0];

                if (latest) {
                    setPrice(latest.price_usd);
                    setVariation(latest.change_percent_24h);
                }

                const histRes = await fetch(
                    `http://localhost:3004/prices/history/${symbol}?timeframe=${timeframe}`
                );
                const rawHistory = await histRes.json();
                const filtered = filterTimeframe(rawHistory, timeframe);
                setHistory(filtered);

                const indRes = await fetch(`http://localhost:3004/indicators/${symbol}`);
                const indData = await indRes.json();
                setIndicators(indData);
            } catch (err) {
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [symbol, timeframe, cryptos]);

    const series = [
        {
            name: "Price",
            data: history.map(p => ({
                x: new Date(p.time),
                y: p.price
            })),
            color: "#ffffff"
        },

        smaVisible.sma7 && indicators?.sma7Series && {
            name: "SMA 7",
            data: indicators.sma7Series
                .map((v, i) => history[i] ? ({ x: new Date(history[i].time), y: v }) : null)
                .filter(Boolean),
            color: "#FF00FF"
        },

        smaVisible.sma30 && indicators?.sma30Series && {
            name: "SMA 30",
            data: indicators.sma30Series
                .map((v, i) => history[i] ? ({ x: new Date(history[i].time), y: v }) : null)
                .filter(Boolean),
            color: "#FFFF00"
        }
    ].filter(Boolean);

    const options = {
        chart: {
            type: "line",
            toolbar: { show: false }
        },
        stroke: {
            curve: "smooth",
            width: 2
        },
        xaxis: {
            type: "datetime",
            tickAmount:
                timeframe === "24h"
                    ? 6
                    : timeframe === "7d"
                        ? 7
                        : timeframe === "1m"
                            ? 8
                            : timeframe === "6m"
                                ? 6
                                : 6,
            labels: {
                formatter: (value, timestamp) =>
                    formatXAxisLabel(timeframe, timestamp ?? value),
            },
        },
        yaxis: {
            labels: {
                formatter: v => (isNaN(v) ? "" : "$" + v.toFixed(2))
            }
        },
        tooltip: {
            theme: "dark",
            x: {
                formatter: (value) => {
                    const date = new Date(value);
                    if (Number.isNaN(date.getTime())) return "";

                    if (timeframe === "24h") {
                        return new Intl.DateTimeFormat("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                        }).format(date);
                    }

                    return new Intl.DateTimeFormat("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: timeframe === "1y" ? "2-digit" : undefined,
                    }).format(date);
                },
            },
        }
    };

    return (
        <div className="rounded-xl border border-white/10 bg-black/40 p-6 space-y-8">

            {/* HEADER */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <p className="text-white text-4xl font-black">Technical Indicators</p>
                    <p className="text-white/60">Analyze market trends with SMA overlays</p>
                </div>
            </div>

            {/* CONTROLS */}
            <div className="flex justify-between flex-wrap gap-4">

                {/* CRYPTO SELECT */}
                <select
                    value={symbol}
                    onChange={e => setSymbol(e.target.value)}
                    className="h-10 rounded-lg bg-white/10 border border-white/20 text-white px-3"
                >
                    {cryptos.map(c => (
                        <option key={c.id} value={c.symbol}  className="bg-[#0f0f1a] text-white">
                            {c.symbol.toUpperCase()}
                        </option>
                    ))}
                </select>

                {/* TIMEFRAME */}
                <div className="flex gap-2">
                    {["24h", "7d", "1m", "6m", "1y"].map(tf => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`px-3 py-1 rounded-lg text-sm ${
                                timeframe === tf
                                    ? "bg-primary text-white"
                                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                            }`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>

                {/* SMA toggles */}
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-white/80">
                        <input
                            type="checkbox"
                            checked={smaVisible.sma7}
                            onChange={() => setSmaVisible({ ...smaVisible, sma7: !smaVisible.sma7 })}
                            className="form-checkbox text-[#FF00FF]"
                        />
                        SMA (7)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-white/80">
                        <input
                            type="checkbox"
                            checked={smaVisible.sma30}
                            onChange={() => setSmaVisible({ ...smaVisible, sma30: !smaVisible.sma30 })}
                            className="form-checkbox text-[#FFFF00]"
                        />
                        SMA (30)
                    </label>
                </div>

            </div>

            {/* PRICE + VARIATION */}
            {!loading && (
                <div className="flex items-start gap-4 mt-4">
                    <div>
                        <p className="text-white text-[32px] font-bold">
                            {price !== null && price !== undefined
                                ? `$${Number(price).toLocaleString()}`
                                : "-"}
                        </p>
                        <div className="flex gap-2">
                            <p className={`${variation >= 0 ? "text-green-400" : "text-red-400"} text-base font-medium`}>
                                {variation !== null && variation !== undefined
                                    ? `${Number(variation) >= 0 ? "+" : ""}${Number(variation).toFixed(2)}%`
                                    : "-"}
                            </p>
                            <p className="text-white/50 text-sm">Today</p>
                        </div>
                    </div>
                </div>
            )}

            {/* THE CHART */}
            <div className="rounded-xl bg-black/30 border border-white/10 p-4">
                {loading ? (
                    <p className="text-white">Loading chart...</p>
                ) : (
                    <Chart options={options} series={series} height={400} />
                )}
            </div>
        </div>
    );
}
