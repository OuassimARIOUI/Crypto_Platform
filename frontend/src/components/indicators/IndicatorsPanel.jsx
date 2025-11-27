"use client";

import { useEffect, useState } from "react";
import Chart from "react-apexcharts";

export default function IndicatorsPanel() {
    const [cryptos, setCryptos] = useState([]);
    const [symbol, setSymbol] = useState("btc");
    const [timeframe, setTimeframe] = useState("24h");

    const [price, setPrice] = useState(null);
    const [variation, setVariation] = useState(null);
    const [indicators, setIndicators] = useState(null);
    const [history, setHistory] = useState([]);
    const [smaVisible, setSmaVisible] = useState({ sma7: true, sma30: true });

    const [loading, setLoading] = useState(true);

    // LOAD CRYPTOS LIST
    useEffect(() => {
        async function loadCryptos() {
            const res = await fetch("http://localhost:3004/cryptos");
            const data = await res.json();
            setCryptos(data || []);
        }
        loadCryptos();
    }, []);

    // LOAD PRICE + INDICATORS + HISTORY
    useEffect(() => {
        async function loadData() {
            setLoading(true);

            try {
                // LATEST PRICE
                const priceRes = await fetch("http://localhost:3004/prices");
                const priceData = await priceRes.json();
                const latest = priceData
                    .filter(p => p.crypto_id === cryptos.find(c => c.symbol === symbol)?.id)
                    .sort((a, b) => new Date(b.fetched_at) - new Date(a.fetched_at))[0];

                if (latest) {
                    setPrice(latest.price_usd);
                    setVariation(latest.change_percent_24h);
                }

                // INDICATORS
                const indRes = await fetch(
                    `http://localhost:3004/indicators/${symbol}`
                );
                setIndicators(await indRes.json());

                // HISTORY
                const histRes = await fetch(
                    `http://localhost:3004/prices/history/${symbol}?timeframe=${timeframe}`
                );
                setHistory(await histRes.json());
            } finally {
                setLoading(false);
            }
        }

        if (cryptos.length > 0) loadData();
    }, [symbol, timeframe, cryptos]);

    // --------------------- CHART DATA ---------------------
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
            name: "SMA7",
            data: indicators.sma7Series.map((p, i) => ({
                x: new Date(history[i]?.time),
                y: p
            })),
            color: "#FF00FF"
        },
        smaVisible.sma30 && indicators?.sma30Series && {
            name: "SMA30",
            data: indicators.sma30Series.map((p, i) => ({
                x: new Date(history[i]?.time),
                y: p
            })),
            color: "#FFFF00"
        }
    ].filter(Boolean);

    const options = {
        chart: {
            type: "line",
            toolbar: { show: false },
            animations: { enabled: true, easing: "easeinout" }
        },
        stroke: {
            curve: "smooth",
            width: [3, 2, 2],
        },
        grid: {
            borderColor: "rgba(255,255,255,0.15)",
            strokeDashArray: 0,
            row: { opacity: 0.3 }
        },
        xaxis: { type: "datetime", labels: { style: { colors: "#aaa" } } },
        yaxis: { labels: { style: { colors: "#aaa" }, formatter: v => "$" + v.toFixed(2) } },
        tooltip: {
            theme: "dark",
            x: { format: "dd MMM HH:mm" }
        },
        legend: { show: false }
    };

    // --------------------- UI ---------------------
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
                        <option key={c.id} value={c.symbol}>
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
                            ${price?.toLocaleString()}
                        </p>
                        <div className="flex gap-2">
                            <p className={`${variation >= 0 ? "text-green-400" : "text-red-400"} text-base font-medium`}>
                                {variation}
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
