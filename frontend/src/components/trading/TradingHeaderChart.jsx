"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const TIMEFRAME_BUTTONS = [
    { label: "1H", key: "1h" },
    { label: "4H", key: "4h" },
    { label: "24H", key: "24h" },
    { label: "7D", key: "7d" },
    { label: "1M", key: "1m" },
];

const YMODE_BUTTONS = [
    { label: "Price", key: "price" },
    { label: "Variation %", key: "pct" },
];

function formatUsd(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "-";

    // Compact formatting without hardcoding styles.
    if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
    if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
    return `$${n.toFixed(2)}`;
}

function toSeries(symbol, rows, yMode) {
    const pts = (rows || [])
        .map((r) => {
            const t = new Date(r.time).getTime();
            const p = Number(r.price);
            if (!Number.isFinite(t) || !Number.isFinite(p)) return null;
            return { x: t, y: p };
        })
        .filter(Boolean);

    if (yMode === "pct" && pts.length > 0) {
        const base = pts[0].y;
        const safeBase = base && Number.isFinite(base) ? base : 0;
        const pctPts = pts.map((pt) => {
            const y = safeBase > 0 ? ((pt.y / safeBase) - 1) * 100 : 0;
            return { x: pt.x, y };
        });
        return { name: symbol.toUpperCase(), data: pctPts };
    }

    return { name: symbol.toUpperCase(), data: pts };
}

export default function TradingHeaderChart() {
    const [timeframe, setTimeframe] = useState("1h");
    const [loading, setLoading] = useState(true);
    const [yMode, setYMode] = useState("price");
    const [cryptos, setCryptos] = useState([]);
    const [selectedSymbols, setSelectedSymbols] = useState(["btc"]);
    const [histories, setHistories] = useState({});
    const [latestBySymbol, setLatestBySymbol] = useState({});

    useEffect(() => {
        let cancelled = false;

        async function loadCryptos() {
            try {
                const res = await fetch("http://localhost:3004/cryptos");
                const data = await res.json();
                const list = Array.isArray(data) ? data : [];

                if (!cancelled) {
                    setCryptos(list);

                    // Keep existing selection if possible, otherwise default to BTC or first item.
                    if (selectedSymbols.length === 0) {
                        const hasBtc = list.some((c) => String(c.symbol).toLowerCase() === "btc");
                        setSelectedSymbols([hasBtc ? "btc" : String(list?.[0]?.symbol || "btc").toLowerCase()]);
                    }
                }
            } catch {
                if (!cancelled) setCryptos([]);
            }
        }

        loadCryptos();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            try {
                const symbols = (selectedSymbols || []).map((s) => String(s).toLowerCase());
                if (symbols.length === 0) {
                    if (!cancelled) {
                        setHistories({});
                        setLatestBySymbol({});
                    }
                    return;
                }

                // Load latest prices for header/legend (best-effort)
                const [pricesRes, cryptosRes] = await Promise.all([
                    fetch("http://localhost:3004/prices"),
                    fetch("http://localhost:3004/cryptos"),
                ]);
                const prices = await pricesRes.json();
                const cryptosData = await cryptosRes.json();

                const idBySymbol = new Map(
                    (Array.isArray(cryptosData) ? cryptosData : []).map((c) => [
                        String(c.symbol).toLowerCase(),
                        c.id,
                    ])
                );

                const latestMap = {};
                for (const sym of symbols) {
                    const id = idBySymbol.get(sym);
                    const row = id ? (Array.isArray(prices) ? prices : []).find((p) => p.crypto_id === id) : null;
                    latestMap[sym] = row || null;
                }

                // Load history per selected symbol (in parallel)
                const histResults = await Promise.all(
                    symbols.map(async (sym) => {
                        const res = await fetch(
                            `http://localhost:3004/prices/history/${sym}?timeframe=${timeframe}`
                        );
                        const raw = await res.json();
                        return [sym, Array.isArray(raw) ? raw : []];
                    })
                );

                if (!cancelled) {
                    const nextHist = {};
                    for (const [sym, rows] of histResults) nextHist[sym] = rows;
                    setHistories(nextHist);
                    setLatestBySymbol(latestMap);
                }
            } catch {
                if (!cancelled) {
                    setHistories({});
                    setLatestBySymbol({});
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [timeframe, selectedSymbols]);

    const series = useMemo(() => {
        const syms = (selectedSymbols || []).map((s) => String(s).toLowerCase());
        return syms.map((sym) => toSeries(sym, histories?.[sym] || [], yMode));
    }, [histories, selectedSymbols, yMode]);

    const primarySymbol = (selectedSymbols?.[0] || "").toLowerCase();
    const primaryLatest = latestBySymbol?.[primarySymbol] || null;
    const headerPrice = primaryLatest?.price_usd ?? null;
    const headerVar24h = primaryLatest?.change_percent_24h ?? null;

    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="space-y-1">
                    <p className="text-white text-lg font-bold">Compare cryptos</p>
                    <p className="text-gray-300 text-sm">
                        Time by {yMode === "price" ? "price (USD)" : "variation (%)"}
                    </p>

                    <div className="flex items-end gap-3 mt-2">
                        <p className="text-white text-[28px] font-black leading-tight truncate">
                            {primarySymbol ? primarySymbol.toUpperCase() + "/USD" : "-"}
                        </p>
                        <p className="text-white text-[28px] font-black leading-tight truncate">
                            {loading ? "…" : headerPrice != null ? formatUsd(headerPrice) : "-"}
                        </p>
                        <div className="flex gap-2 pb-1">
                            <p className="text-gray-300 text-sm font-medium">24H</p>
                            <p className={`text-sm font-bold ${Number(headerVar24h) >= 0 ? "text-green-400" : "text-red-400"}`}>
                                {loading
                                    ? "…"
                                    : headerVar24h != null
                                        ? `${Number(headerVar24h) >= 0 ? "+" : ""}${Number(headerVar24h).toFixed(2)}%`
                                        : "-"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 justify-start lg:justify-end">
                        <div className="flex items-center gap-1 bg-black/30 p-1 rounded-lg border border-white/10">
                            {TIMEFRAME_BUTTONS.map((b) => (
                                <button
                                    key={b.key}
                                    onClick={() => setTimeframe(b.key)}
                                    className={
                                        timeframe === b.key
                                            ? "text-black bg-primary text-xs font-bold py-2 px-3 rounded-md"
                                            : "text-gray-300 hover:text-white text-xs font-bold py-2 px-3 rounded-md"
                                    }
                                >
                                    {b.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-1 bg-black/30 p-1 rounded-lg border border-white/10">
                            {YMODE_BUTTONS.map((b) => (
                                <button
                                    key={b.key}
                                    onClick={() => setYMode(b.key)}
                                    className={
                                        yMode === b.key
                                            ? "text-black bg-primary text-xs font-bold py-2 px-3 rounded-md"
                                            : "text-gray-300 hover:text-white text-xs font-bold py-2 px-3 rounded-md"
                                    }
                                >
                                    {b.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-start lg:justify-end">
                        {(cryptos || []).slice(0, 20).map((c) => {
                            const sym = String(c.symbol).toLowerCase();
                            const active = selectedSymbols.includes(sym);
                            return (
                                <button
                                    key={c.id}
                                    onClick={() => {
                                        setSelectedSymbols((prev) => {
                                            const next = new Set(prev);
                                            if (next.has(sym)) {
                                                next.delete(sym);
                                            } else {
                                                next.add(sym);
                                            }
                                            return Array.from(next);
                                        });
                                    }}
                                    className={
                                        active
                                            ? "px-3 py-1 rounded-full bg-primary text-black text-xs font-bold"
                                            : "px-3 py-1 rounded-full border border-white/10 bg-black/20 text-gray-200 text-xs font-bold hover:bg-black/30"
                                    }
                                >
                                    {c.symbol.toUpperCase()}
                                </button>
                            );
                        })}
                    </div>

                    <p className="text-gray-400 text-xs text-right">
                        Tip: click symbols to compare (max 20 shown)
                    </p>
                </div>
            </div>

            <div className="h-[360px] w-full">
                <Chart
                    type="line"
                    height={360}
                    series={series}
                    options={{
                        chart: {
                            id: "trading-compare",
                            animations: { enabled: true },
                            toolbar: { show: false },
                            zoom: { enabled: false },
                        },
                        stroke: {
                            curve: "smooth",
                            width: 3,
                        },
                        dataLabels: { enabled: false },
                        legend: {
                            show: true,
                            position: "top",
                        },
                        tooltip: {
                            theme: "dark",
                            shared: true,
                            x: { format: "dd MMM HH:mm" },
                            y: {
                                formatter: (val) =>
                                    yMode === "price" ? formatUsd(val) : `${Number(val).toFixed(2)}%`,
                            },
                        },
                        xaxis: {
                            type: "datetime",
                            title: { text: "Time" },
                            labels: { datetimeUTC: false },
                            tooltip: { enabled: true },
                        },
                        yaxis: {
                            title: { text: yMode === "price" ? "Price (USD)" : "Variation (%)" },
                            labels: {
                                formatter: (val) =>
                                    yMode === "price" ? formatUsd(val) : `${Number(val).toFixed(2)}%`,
                            },
                        },
                        grid: {
                            show: true,
                        },
                        noData: {
                            text: loading ? "Loading…" : "Select at least one crypto",
                        },
                    }}
                />
            </div>
        </div>
    );
}
