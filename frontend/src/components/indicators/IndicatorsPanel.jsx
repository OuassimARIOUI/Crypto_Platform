"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Cookies from "js-cookie";

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

    const [alertType, setAlertType] = useState("PERCENT_UP");
    const [alertThreshold, setAlertThreshold] = useState("5");
    const [alertStatus, setAlertStatus] = useState("");

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
            toolbar: { show: false },
            background: "transparent",
            foreColor: "rgba(255,255,255,0.8)",
        },
        stroke: {
            curve: "smooth",
            width: 2
        },
        grid: {
            borderColor: "rgba(255,255,255,0.10)",
            strokeDashArray: 0,
            padding: {
                left: 8,
                right: 8,
            },
        },
        legend: {
            show: false,
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
                style: {
                    colors: "rgba(255,255,255,0.50)",
                    fontSize: "12px",
                    fontWeight: 700,
                },
            },
        },
        yaxis: {
            labels: {
                formatter: v => (isNaN(v) ? "" : "$" + Number(v).toFixed(2)),
                style: {
                    colors: "rgba(255,255,255,0.50)",
                    fontSize: "12px",
                    fontWeight: 700,
                },
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

    async function createAlert() {
        const token = Cookies.get("token");
        if (!token) {
            setAlertStatus("You must be logged in to create alerts.");
            return;
        }

        setAlertStatus("");

        try {
            const res = await fetch("http://localhost:3004/alerts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + token,
                },
                body: JSON.stringify({
                    symbol,
                    type: alertType,
                    threshold: alertThreshold,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Failed to create alert");

            setAlertStatus("Alert created.");
        } catch (e) {
            setAlertStatus(e.message || "Failed to create alert");
        }
    }

    return (
        <div className="space-y-6">
            {/* Page heading (style from design) */}
            <div className="flex justify-between items-start gap-4">
                <div className="flex flex-col gap-2">
                    <p className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                        Technical Indicators
                    </p>
                    <p className="text-white/60 text-base font-normal leading-normal">
                        Analyze market trends with SMA and other overlays
                    </p>
                </div>
            </div>

            {/* Main chart area */}
            <div className="rounded-xl border border-white/10 bg-black/30 p-6">
                {/* Controls */}
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    {/* Crypto selector */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        <select
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value)}
                            className="w-full sm:w-auto flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-white/10 pl-4 pr-3 text-white hover:bg-white/20 transition-colors duration-200 border border-white/10"
                        >
                            {cryptos.map((c) => (
                                <option key={c.id} value={c.symbol} className="bg-black text-white">
                                    {c.symbol.toUpperCase()}/USD
                                </option>
                            ))}
                        </select>

                        {/* Timeframe chips */}
                        <div className="flex flex-wrap gap-2">
                            {["24h", "7d", "1m", "6m", "1y"].map((tf) => (
                                <button
                                    key={tf}
                                    onClick={() => setTimeframe(tf)}
                                    className={`h-10 px-4 rounded-lg text-sm font-medium transition-colors duration-200 border ${
                                        timeframe === tf
                                            ? "bg-primary/20 text-primary border-primary/30"
                                            : "bg-black/30 text-white/70 border-white/10 hover:bg-white/10 hover:text-white"
                                    }`}
                                >
                                    {tf}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Indicator toggles */}
                    <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-white/80">
                            <input
                                type="checkbox"
                                checked={smaVisible.sma7}
                                onChange={() =>
                                    setSmaVisible({
                                        ...smaVisible,
                                        sma7: !smaVisible.sma7,
                                    })
                                }
                                className="form-checkbox rounded-sm bg-black/40 border-white/20 text-primary focus:ring-primary focus:ring-offset-black"
                            />
                            SMA (7)
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-white/80">
                            <input
                                type="checkbox"
                                checked={smaVisible.sma30}
                                onChange={() =>
                                    setSmaVisible({
                                        ...smaVisible,
                                        sma30: !smaVisible.sma30,
                                    })
                                }
                                className="form-checkbox rounded-sm bg-black/40 border-white/20 text-[#FFFF00] focus:ring-[#FFFF00] focus:ring-offset-black"
                            />
                            SMA (30)
                        </label>
                    </div>
                </div>

                {/* Chart & legend */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-start gap-4">
                        <div className="flex flex-col">
                            <p className="text-white tracking-light text-[32px] font-bold leading-tight truncate">
                                {!loading && price !== null && price !== undefined
                                    ? `$${Number(price).toLocaleString()}`
                                    : "-"}
                            </p>
                            <div className="flex gap-2 items-center">
                                <p
                                    className={`${
                                        Number(variation) >= 0
                                            ? "text-green-400"
                                            : "text-red-400"
                                    } text-base font-medium leading-normal`}
                                >
                                    {!loading && variation !== null && variation !== undefined
                                        ? `${Number(variation) >= 0 ? "+" : ""}${Number(
                                            variation
                                        ).toFixed(2)}%`
                                        : "-"}
                                </p>
                                <p className="text-white/50 text-sm font-normal leading-normal">
                                    Today
                                </p>
                            </div>
                        </div>

                        <div className="ml-auto flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-0.5 bg-white rounded-full" />
                                <span className="text-white/80">Price</span>
                            </div>
                            {smaVisible.sma7 && (
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-0.5 bg-[#FF00FF] rounded-full" />
                                    <span className="text-white/80 flex items-center gap-1">
                                        SMA7
                                        <button
                                            type="button"
                                            className="text-white/60 hover:text-white/90 text-xs"
                                            title="SMA7 = Simple Moving Average sur 7 points. À chaque instant, on calcule la moyenne des 7 derniers prix de la série (les 'points' dépendent du timeframe)."
                                            aria-label="Info SMA7"
                                        >
                                            ⓘ
                                        </button>
                                    </span>
                                </div>
                            )}
                            {smaVisible.sma30 && (
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-0.5 bg-[#FFFF00] rounded-full" />
                                    <span className="text-white/80 flex items-center gap-1">
                                        SMA30
                                        <button
                                            type="button"
                                            className="text-white/60 hover:text-white/90 text-xs"
                                            title="SMA30 = Simple Moving Average sur 30 points. Même principe que SMA7 mais sur une fenêtre plus longue, donc plus lissée (réagit moins vite)."
                                            aria-label="Info SMA30"
                                        >
                                            ⓘ
                                        </button>
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="relative h-[400px] w-full rounded-xl border border-white/10 bg-black/20 overflow-hidden">
                        {/* Decorative grid lines (style only) */}
                        <div className="absolute inset-0 grid grid-rows-5 pointer-events-none">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="border-t border-white/10" />
                            ))}
                        </div>

                        <div className="absolute inset-0">
                            {loading ? (
                                <div className="h-full w-full flex items-center justify-center">
                                    <p className="text-white/80">Loading chart...</p>
                                </div>
                            ) : (
                                <Chart options={options} series={series} height={400} />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            <div className="rounded-xl border border-white/10 bg-black/30 p-6">
                <div className="flex flex-col gap-2 mb-4">
                    <p className="text-white text-xl font-bold">Discord Alerts</p>
                    <p className="text-white/60 text-sm">
                        Create an alert for {symbol.toUpperCase()}. When triggered, you’ll receive a Discord DM if your account is connected.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
                    <label className="flex flex-col gap-2 flex-1">
                        <p className="text-white/80 text-sm">Type</p>
                        <select
                            value={alertType}
                            onChange={(e) => setAlertType(e.target.value)}
                            className="h-12 rounded-lg bg-white/10 border border-white/20 text-white px-3"
                        >
                            <option value="PERCENT_UP" className="bg-black text-white">24h % up </option>
                            <option value="PERCENT_DOWN" className="bg-black text-white">24h % down </option>
                            <option value="PRICE_ABOVE" className="bg-black text-white">Price above </option>
                            <option value="PRICE_BELOW" className="bg-black text-white">Price below </option>
                        </select>
                    </label>

                    <label className="flex flex-col gap-2 flex-1">
                        <p className="text-white/80 text-sm">Threshold</p>
                        <input
                            value={alertThreshold}
                            onChange={(e) => setAlertThreshold(e.target.value)}
                            placeholder={alertType.startsWith("PERCENT") ? "ex: 5" : "ex: 42000"}
                            className="h-12 rounded-lg bg-white/10 border border-white/20 text-white px-3"
                        />
                    </label>

                    <button
                        type="button"
                        onClick={createAlert}
                        className="h-12 px-5 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
                    >
                        Create Alert
                    </button>
                </div>

                {alertStatus && (
                    <p className="mt-3 text-white/70 text-sm">{alertStatus}</p>
                )}
            </div>
        </div>
    );
}
