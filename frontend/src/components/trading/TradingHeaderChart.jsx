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

// Crypto logos map
const cryptoLogos = {
    btc: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
    eth: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    bnb: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
    xrp: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
    ada: "https://assets.coingecko.com/coins/images/975/small/cardano.png",
    doge: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
    sol: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
    dot: "https://assets.coingecko.com/coins/images/12171/small/polkadot.png",
    matic: "https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png",
    ltc: "https://assets.coingecko.com/coins/images/2/small/litecoin.png",
    usdt: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
    usdc: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png",
};

function formatUsd(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "-";

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

// Crypto pill component with logo
function CryptoPill({ crypto, active, onClick }) {
    const [imgError, setImgError] = useState(false);
    const sym = String(crypto.symbol).toLowerCase();
    const logoUrl = cryptoLogos[sym];

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                active
                    ? "bg-primary text-black shadow-lg shadow-primary/20"
                    : "border border-white/10 bg-black/20 text-gray-300 hover:bg-black/30 hover:border-white/20"
            }`}
        >
            {!imgError && logoUrl ? (
                <img 
                    src={logoUrl} 
                    alt={sym} 
                    className="w-4 h-4 rounded-full" 
                    onError={() => setImgError(true)}
                />
            ) : (
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary/50 to-primary/20 flex items-center justify-center text-[8px] text-white">
                    {sym.slice(0, 2).toUpperCase()}
                </div>
            )}
            {crypto.symbol.toUpperCase()}
        </button>
    );
}

export default function TradingHeaderChart() {
    const [theme, setTheme] = useState("dark");
    const [timeframe, setTimeframe] = useState("1h");
    const [loading, setLoading] = useState(true);
    const [yMode, setYMode] = useState("price");
    const [cryptos, setCryptos] = useState([]);
    const [selectedSymbols, setSelectedSymbols] = useState(["btc"]);
    const [histories, setHistories] = useState({});
    const [latestBySymbol, setLatestBySymbol] = useState({});

    useEffect(() => {
        const getTheme = () => (document.documentElement.dataset.theme === "light" ? "light" : "dark");
        setTheme(getTheme());

        const observer = new MutationObserver(() => setTheme(getTheme()));
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-theme"],
        });

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function loadCryptos() {
            try {
                const res = await fetch("http://localhost:3004/cryptos");
                const data = await res.json();
                const list = Array.isArray(data) ? data : [];

                if (!cancelled) {
                    setCryptos(list);

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

    const isLight = theme === "light";
    const chartText = isLight ? "rgba(11,18,32,0.80)" : "rgba(255,255,255,0.80)";
    const chartTextMuted = isLight ? "rgba(11,18,32,0.55)" : "rgba(255,255,255,0.55)";
    const chartGrid = isLight ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.10)";

    const primaryLogoUrl = cryptoLogos[primarySymbol];

    return (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-white/10">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    {/* Left: Price info */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                </svg>
                            </div>
                            <p className="text-gray-400 text-sm font-medium">
                                Compare by {yMode === "price" ? "Price (USD)" : "Variation (%)"}
                            </p>
                        </div>

                        {/* Main price display */}
                        <div className="flex items-center gap-4">
                            {primaryLogoUrl && (
                                <img src={primaryLogoUrl} alt={primarySymbol} className="w-12 h-12 rounded-full" />
                            )}
                            <div>
                                <div className="flex items-baseline gap-3">
                                    <p className="text-white text-3xl font-black">
                                        {primarySymbol ? primarySymbol.toUpperCase() + "/USD" : "-"}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 mt-1">
                                    <p className="text-white text-2xl font-bold">
                                        {loading ? "..." : headerPrice != null ? formatUsd(headerPrice) : "-"}
                                    </p>
                                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium ${
                                        Number(headerVar24h) >= 0 
                                            ? "bg-green-500/20 text-green-400" 
                                            : "bg-red-500/20 text-red-400"
                                    }`}>
                                        {Number(headerVar24h) >= 0 ? (
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                            </svg>
                                        ) : (
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                            </svg>
                                        )}
                                        {loading
                                            ? "..."
                                            : headerVar24h != null
                                                ? `${Math.abs(Number(headerVar24h)).toFixed(2)}%`
                                                : "-"}
                                    </div>
                                    <span className="text-gray-500 text-xs">24h</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Controls */}
                    <div className="flex flex-col gap-3">
                        {/* Timeframe & Y-Mode buttons */}
                        <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">
                            <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/10">
                                {TIMEFRAME_BUTTONS.map((b) => (
                                    <button
                                        key={b.key}
                                        onClick={() => setTimeframe(b.key)}
                                        className={`text-xs font-bold py-2 px-3 rounded-lg transition-all ${
                                            timeframe === b.key
                                                ? "bg-primary text-black shadow-sm"
                                                : "text-gray-400 hover:text-white hover:bg-white/5"
                                        }`}
                                    >
                                        {b.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/10">
                                {YMODE_BUTTONS.map((b) => (
                                    <button
                                        key={b.key}
                                        onClick={() => setYMode(b.key)}
                                        className={`text-xs font-bold py-2 px-3 rounded-lg transition-all ${
                                            yMode === b.key
                                                ? "bg-primary text-black shadow-sm"
                                                : "text-gray-400 hover:text-white hover:bg-white/5"
                                        }`}
                                    >
                                        {b.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Crypto selector pills */}
                        <div className="flex flex-wrap gap-2 justify-start lg:justify-end max-w-xl">
                            {(cryptos || []).slice(0, 15).map((c) => {
                                const sym = String(c.symbol).toLowerCase();
                                const active = selectedSymbols.includes(sym);
                                return (
                                    <CryptoPill
                                        key={c.id}
                                        crypto={c}
                                        active={active}
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
                                    />
                                );
                            })}
                        </div>

                        <p className="text-gray-500 text-xs text-right">
                            Click cryptocurrencies to compare • {selectedSymbols.length} selected
                        </p>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="p-6 pt-4">
                <div className="h-[360px] w-full">
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <svg className="animate-spin w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <p className="text-gray-400 text-sm">Loading chart data...</p>
                            </div>
                        </div>
                    ) : (
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
                                    background: "transparent",
                                    foreColor: chartText,
                                },
                                stroke: {
                                    curve: "smooth",
                                    width: 3,
                                },
                                colors: ['#00E396', '#008FFB', '#FEB019', '#FF4560', '#775DD0', '#00D9E9', '#FF66C3'],
                                dataLabels: { enabled: false },
                                legend: {
                                    show: true,
                                    position: "top",
                                    horizontalAlign: "left",
                                    labels: {
                                        colors: chartText,
                                    },
                                },
                                tooltip: {
                                    theme: isLight ? "light" : "dark",
                                    shared: true,
                                    x: { format: "dd MMM HH:mm" },
                                    y: {
                                        formatter: (val) =>
                                            yMode === "price" ? formatUsd(val) : `${Number(val).toFixed(2)}%`,
                                    },
                                },
                                xaxis: {
                                    type: "datetime",
                                    labels: { 
                                        datetimeUTC: false,
                                        style: { colors: chartTextMuted },
                                    },
                                    axisBorder: { show: false },
                                    axisTicks: { show: false },
                                },
                                yaxis: {
                                    labels: {
                                        formatter: (val) =>
                                            yMode === "price" ? formatUsd(val) : `${Number(val).toFixed(2)}%`,
                                        style: { colors: chartTextMuted, fontWeight: 600 },
                                    },
                                },
                                grid: {
                                    show: true,
                                    borderColor: chartGrid,
                                    strokeDashArray: 3,
                                },
                                noData: {
                                    text: "Select at least one cryptocurrency",
                                    style: {
                                        color: chartTextMuted,
                                        fontSize: '14px',
                                    },
                                },
                                markers: {
                                    size: 0,
                                    hover: { size: 5 },
                                },
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
