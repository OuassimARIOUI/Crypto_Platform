"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Cookies from "js-cookie";

// Logo map for crypto icons
const logoMap = {
    btc: "bitcoin", eth: "ethereum", usdt: "tether", xrp: "xrp",
    bnb: "binancecoin", ada: "cardano", sol: "solana", dot: "polkadot",
    usdc: "usd-coin", trx: "tron", doge: "dogecoin", avax: "avalanche",
    matic: "polygon", shib: "shiba-inu", link: "chainlink", ltc: "litecoin",
    uni: "uniswap", atom: "cosmos", xlm: "stellar", etc: "ethereum-classic",
};

// CryptoPill component
function CryptoPill({ crypto, isSelected, onClick }) {
    const [imgError, setImgError] = useState(false);
    const logoUrl = `https://assets.coincap.io/assets/icons/${crypto.symbol.toLowerCase()}@2x.png`;

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 border ${
                isSelected
                    ? "bg-primary/20 border-primary/40 text-white shadow-lg shadow-primary/20"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20"
            }`}
        >
            {imgError ? (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/50 to-primary/20 flex items-center justify-center text-[10px] font-bold">
                    {crypto.symbol.slice(0, 2).toUpperCase()}
                </div>
            ) : (
                <img
                    src={logoUrl}
                    alt={crypto.symbol}
                    className="w-6 h-6 rounded-full"
                    onError={() => setImgError(true)}
                />
            )}
            <span className="font-medium text-sm">{crypto.symbol.toUpperCase()}</span>
        </button>
    );
}

export default function IndicatorsPanel() {
    const [theme, setTheme] = useState("dark");
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
    const [alertLoading, setAlertLoading] = useState(false);

    const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

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

    const isLight = theme === "light";
    const chartText = isLight ? "rgba(11,18,32,0.80)" : "rgba(255,255,255,0.80)";
    const chartTextMuted = isLight ? "rgba(11,18,32,0.50)" : "rgba(255,255,255,0.50)";
    const chartGrid = isLight ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.10)";
    const priceLine = isLight ? "rgba(11,18,32,0.85)" : "#ffffff";

    function formatXAxisLabel(timeframe, ts) {
        if (!ts) return "";
        const date = new Date(ts);
        if (Number.isNaN(date.getTime())) return "";
        const locale = "fr-FR";

        if (timeframe === "24h") {
            return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(date);
        }
        if (timeframe === "7d" || timeframe === "1m") {
            return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(date);
        }
        if (timeframe === "6m") {
            return new Intl.DateTimeFormat(locale, { month: "short" }).format(date);
        }
        if (timeframe === "1y") {
            return new Intl.DateTimeFormat(locale, { month: "short", year: "2-digit" }).format(date);
        }
        return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(date);
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
            data: history.map(p => ({ x: new Date(p.time), y: p.price })),
            color: priceLine
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
            foreColor: chartText,
            animations: { enabled: true, easing: "easeinout", speed: 500 }
        },
        stroke: { curve: "smooth", width: 2 },
        grid: {
            borderColor: chartGrid,
            strokeDashArray: 0,
            padding: { left: 8, right: 8 },
        },
        legend: { show: false },
        xaxis: {
            type: "datetime",
            tickAmount: timeframe === "24h" ? 6 : timeframe === "7d" ? 7 : timeframe === "1m" ? 8 : 6,
            labels: {
                formatter: (value, timestamp) => formatXAxisLabel(timeframe, timestamp ?? value),
                style: { colors: chartTextMuted, fontSize: "12px", fontWeight: 700 },
            },
        },
        yaxis: {
            labels: {
                formatter: v => (isNaN(v) ? "" : "$" + Number(v).toFixed(2)),
                style: { colors: chartTextMuted, fontSize: "12px", fontWeight: 700 },
            }
        },
        tooltip: {
            theme: isLight ? "light" : "dark",
            x: {
                formatter: (value) => {
                    const date = new Date(value);
                    if (Number.isNaN(date.getTime())) return "";
                    if (timeframe === "24h") {
                        return new Intl.DateTimeFormat("fr-FR", {
                            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                        }).format(date);
                    }
                    return new Intl.DateTimeFormat("fr-FR", {
                        day: "2-digit", month: "short", year: timeframe === "1y" ? "2-digit" : undefined,
                    }).format(date);
                },
            },
        }
    };

    async function createAlert() {
        const token = Cookies.get("token");
        if (!token) {
            setAlertStatus({ type: "error", message: "You must be logged in to create alerts." });
            return;
        }

        setAlertStatus("");
        setAlertLoading(true);

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

            setAlertStatus({ type: "success", message: "Alert created successfully!" });
            setAlertThreshold("");
        } catch (e) {
            setAlertStatus({ type: "error", message: e.message || "Failed to create alert" });
        } finally {
            setAlertLoading(false);
        }
    }

    const selectedCrypto = cryptos.find(c => c.symbol === symbol);
    const logoUrl = selectedCrypto ? `https://assets.coincap.io/assets/icons/${selectedCrypto.symbol.toLowerCase()}@2x.png` : null;

    return (
        <div className="space-y-6">
            {/* Crypto Pills Selector */}
            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm p-4">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-white/60 text-sm font-medium">Select Cryptocurrency</span>
                    <span className="text-white/40 text-xs">{cryptos.length} available</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {cryptos.slice(0, 12).map((c) => (
                        <CryptoPill
                            key={c.id}
                            crypto={c}
                            isSelected={symbol === c.symbol}
                            onClick={() => setSymbol(c.symbol)}
                        />
                    ))}
                    {cryptos.length > 12 && (
                        <select
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value)}
                            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm hover:bg-white/10 transition-colors"
                        >
                            <option value="" disabled className="bg-black">More...</option>
                            {cryptos.slice(12).map((c) => (
                                <option key={c.id} value={c.symbol} className="bg-black text-white">
                                    {c.symbol.toUpperCase()}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Main Chart Area */}
            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm p-6">
                {/* Controls Row */}
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    {/* Timeframe Chips */}
                    <div className="flex flex-wrap gap-2">
                        {["24h", "7d", "1m", "6m", "1y"].map((tf) => (
                            <button
                                key={tf}
                                onClick={() => setTimeframe(tf)}
                                className={`h-10 px-4 rounded-xl text-sm font-medium transition-all duration-200 border ${
                                    timeframe === tf
                                        ? "bg-primary/20 text-primary border-primary/30 shadow-lg shadow-primary/10"
                                        : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white"
                                }`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>

                    {/* Indicator Toggles */}
                    <div className="flex flex-wrap items-center gap-3">
                        <label className={`flex items-center gap-2 cursor-pointer text-sm font-medium px-3 py-2 rounded-xl border transition-all duration-200 ${
                            smaVisible.sma7 
                                ? "bg-[#FF00FF]/10 border-[#FF00FF]/30 text-[#FF00FF]" 
                                : "bg-white/5 border-white/10 text-white/50"
                        }`}>
                            <input
                                type="checkbox"
                                checked={smaVisible.sma7}
                                onChange={() => setSmaVisible({ ...smaVisible, sma7: !smaVisible.sma7 })}
                                className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                smaVisible.sma7 ? "bg-[#FF00FF] border-[#FF00FF]" : "border-white/30"
                            }`}>
                                {smaVisible.sma7 && (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            SMA (7)
                        </label>
                        
                        <label className={`flex items-center gap-2 cursor-pointer text-sm font-medium px-3 py-2 rounded-xl border transition-all duration-200 ${
                            smaVisible.sma30 
                                ? "bg-[#FFFF00]/10 border-[#FFFF00]/30 text-[#FFFF00]" 
                                : "bg-white/5 border-white/10 text-white/50"
                        }`}>
                            <input
                                type="checkbox"
                                checked={smaVisible.sma30}
                                onChange={() => setSmaVisible({ ...smaVisible, sma30: !smaVisible.sma30 })}
                                className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                smaVisible.sma30 ? "bg-[#FFFF00] border-[#FFFF00]" : "border-white/30"
                            }`}>
                                {smaVisible.sma30 && (
                                    <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            SMA (30)
                        </label>
                    </div>
                </div>

                {/* Price Display & Legend */}
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
                    {/* Current Price */}
                    <div className="flex items-center gap-4">
                        {logoUrl && (
                            <img
                                src={logoUrl}
                                alt={symbol}
                                className="w-12 h-12 rounded-full border border-white/10"
                                onError={(e) => e.target.style.display = 'none'}
                            />
                        )}
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="text-white tracking-tight text-3xl font-bold leading-tight">
                                    {!loading && price !== null && price !== undefined
                                        ? `$${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                        : "-"}
                                </p>
                                {!loading && variation !== null && (
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-semibold ${
                                        Number(variation) >= 0 
                                            ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                                    }`}>
                                        {Number(variation) >= 0 ? (
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                            </svg>
                                        ) : (
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        )}
                                        {Number(variation) >= 0 ? "+" : ""}{Number(variation).toFixed(2)}%
                                    </span>
                                )}
                            </div>
                            <p className="text-white/50 text-sm mt-1">
                                {symbol.toUpperCase()}/USD • {timeframe} chart
                            </p>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                            <div className="w-4 h-0.5 bg-white rounded-full" />
                            <span className="text-white/80">Price</span>
                        </div>
                        {smaVisible.sma7 && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FF00FF]/10 border border-[#FF00FF]/20">
                                <div className="w-4 h-0.5 bg-[#FF00FF] rounded-full" />
                                <span className="text-[#FF00FF]/80">SMA7</span>
                            </div>
                        )}
                        {smaVisible.sma30 && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FFFF00]/10 border border-[#FFFF00]/20">
                                <div className="w-4 h-0.5 bg-[#FFFF00] rounded-full" />
                                <span className="text-[#FFFF00]/80">SMA30</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chart Container */}
                <div className="relative h-[400px] w-full rounded-xl border border-white/10 bg-black/20 overflow-hidden">
                    {/* Decorative grid lines */}
                    <div className="absolute inset-0 grid grid-rows-5 pointer-events-none">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="border-t border-white/5" />
                        ))}
                    </div>

                    <div className="absolute inset-0">
                        {loading ? (
                            <div className="h-full w-full flex flex-col items-center justify-center gap-3">
                                <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                <p className="text-white/60 text-sm">Loading chart data...</p>
                            </div>
                        ) : (
                            <Chart options={options} series={series} height={400} />
                        )}
                    </div>
                </div>
            </div>

            {/* Alerts Section */}
            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm p-6">
                <div className="flex items-start gap-4 mb-6">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-white text-xl font-bold">Discord Alerts</h3>
                        <p className="text-white/60 text-sm mt-1">
                            Create an alert for <span className="text-primary font-medium">{symbol.toUpperCase()}</span>. When triggered, you&apos;ll receive a Discord DM if your account is connected.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Alert Type */}
                    <div className="space-y-2">
                        <label className="text-white/60 text-sm font-medium">Alert Type</label>
                        <div className="relative">
                            <select
                                value={alertType}
                                onChange={(e) => setAlertType(e.target.value)}
                                className="w-full h-12 rounded-xl bg-white/5 border border-white/10 text-white px-4 pr-10 appearance-none hover:bg-white/10 transition-colors focus:outline-none focus:border-primary/50"
                            >
                                <option value="PERCENT_UP" className="bg-black text-white">📈 24h % Up</option>
                                <option value="PERCENT_DOWN" className="bg-black text-white">📉 24h % Down</option>
                                <option value="PRICE_ABOVE" className="bg-black text-white">⬆️ Price Above</option>
                                <option value="PRICE_BELOW" className="bg-black text-white">⬇️ Price Below</option>
                            </select>
                            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    {/* Threshold */}
                    <div className="space-y-2">
                        <label className="text-white/60 text-sm font-medium">Threshold</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={alertThreshold}
                                onChange={(e) => setAlertThreshold(e.target.value)}
                                placeholder={alertType.startsWith("PERCENT") ? "e.g., 5" : "e.g., 42000"}
                                className="w-full h-12 rounded-xl bg-white/5 border border-white/10 text-white px-4 placeholder:text-white/30 hover:bg-white/10 transition-colors focus:outline-none focus:border-primary/50"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">
                                {alertType.startsWith("PERCENT") ? "%" : "USD"}
                            </span>
                        </div>
                    </div>

                    {/* Create Button */}
                    <div className="space-y-2">
                        <label className="text-white/60 text-sm font-medium opacity-0 hidden md:block">Action</label>
                        <button
                            type="button"
                            onClick={createAlert}
                            disabled={alertLoading || !alertThreshold}
                            className="w-full h-12 px-5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                        >
                            {alertLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Create Alert
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Alert Status Message */}
                {alertStatus && (
                    <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${
                        alertStatus.type === "success"
                            ? "bg-green-500/10 border border-green-500/20"
                            : "bg-red-500/10 border border-red-500/20"
                    }`}>
                        {alertStatus.type === "success" ? (
                            <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        <span className={alertStatus.type === "success" ? "text-green-400" : "text-red-400"}>
                            {alertStatus.message}
                        </span>
                    </div>
                )}

                {/* Quick Thresholds */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-white/40 text-sm">Quick set:</span>
                    {alertType.startsWith("PERCENT") ? (
                        <>
                            {[3, 5, 10, 15, 20].map((val) => (
                                <button
                                    key={val}
                                    onClick={() => setAlertThreshold(val.toString())}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        alertThreshold === val.toString()
                                            ? "bg-primary/20 text-primary border border-primary/30"
                                            : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white"
                                    }`}
                                >
                                    {val}%
                                </button>
                            ))}
                        </>
                    ) : (
                        <>
                            {price && [0.9, 0.95, 1.05, 1.1, 1.2].map((multiplier) => {
                                const val = Math.round(price * multiplier);
                                return (
                                    <button
                                        key={multiplier}
                                        onClick={() => setAlertThreshold(val.toString())}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                            alertThreshold === val.toString()
                                                ? "bg-primary/20 text-primary border border-primary/30"
                                                : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white"
                                        }`}
                                    >
                                        ${val.toLocaleString()}
                                    </button>
                                );
                            })}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
