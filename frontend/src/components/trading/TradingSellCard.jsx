"use client";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";

export default function TradingSellCard() {
    const [symbol, setSymbol] = useState("btc");
    const [currentPrice, setCurrentPrice] = useState(null);
    const [holding, setHolding] = useState(0);
    const [sellQty, setSellQty] = useState("");
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [cryptos, setCryptos] = useState([]);

    // 1) Charger la liste des cryptos au démarrage
    useEffect(() => {
        fetch("http://localhost:3004/cryptos")
            .then(res => res.json())
            .then(data => setCryptos(data));
    }, []);

    // 2) Charger le portefeuille + prix quand le symbol change
    useEffect(() => {
        async function loadData() {
            try {
                const token = Cookies.get("token");
                if (!token) return;

                const [portfolioRes, pricesRes] = await Promise.all([
                    fetch("http://localhost:3004/portfolio/me", {
                        credentials: "include",
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch("http://localhost:3004/prices"),
                ]);

                const portfolio = await portfolioRes.json();
                const prices = await pricesRes.json();

                const holdings = portfolio.holdings || {};
                setHolding(holdings[symbol] ?? 0);

                // Trouver la crypto via la liste /cryptos (comme BuyCard)
                const crypto = cryptos.find(c => c.symbol === symbol);

                if (crypto) {
                    const priceRow = prices.find(p => p.crypto_id === crypto.id);

                    if (priceRow) {
                        setCurrentPrice(Number(priceRow.price_usd));
                    } else {
                        setCurrentPrice(null);
                    }
                }

                setLoading(false);

            } catch (e) {
                console.error("Error SELL load", e);
                setLoading(false);
            }
        }

        if (cryptos.length > 0) loadData();
    }, [symbol, cryptos]);

    // 3) SELL
    async function handleSell(e) {
        e.preventDefault();
        setMessage("");

        const token = Cookies.get("token");
        if (!token) {
            setMessage("Connexion requise");
            return;
        }

        if (!sellQty || sellQty <= 0) {
            setMessage("Quantité invalide");
            return;
        }

        if (sellQty > holding) {
            setMessage("Tu ne peux pas vendre plus que tu n'as !");
            return;
        }

        try {
            const res = await fetch("http://localhost:3004/portfolio/sell", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    symbol,
                    quantity: Number(sellQty),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.error || "Erreur lors de la vente");
                return;
            }

            // Mise à jour instantanée
            setHolding(prev => prev - Number(sellQty));
            setMessage("Vente réussie ✔");
            setSellQty("");

        } catch (err) {
            console.error(err);
            setMessage("Erreur serveur");
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6 rounded-xl border border-[#315668]/50 bg-[#182b34]/70">
            <p className="text-white text-xl font-bold">Sell</p>

            {loading ? (
                <p className="text-white">Chargement...</p>
            ) : (
                <form className="space-y-4" onSubmit={handleSell}>
                    {/* SYMBOL */}
                    <label className="flex flex-col w-full">
                        <p className="text-white text-base font-medium pb-2">Cryptocurrency</p>

                        <select
                            className="form-select rounded-lg bg-[#182b34] border-[#315668] text-white h-12 px-3"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value)}
                        >
                            {cryptos.map(c => (
                                <option key={c.id} value={c.symbol}>
                                    {c.name} ({c.symbol.toUpperCase()})
                                </option>
                            ))}
                        </select>
                    </label>

                    {/* QUANTITY */}
                    <label className="flex flex-col w-full">
                        <p className="text-white text-base font-medium pb-2">Quantity to Sell</p>
                        <input
                            type="float"
                            min="0"
                            step="0.000001"
                            className="form-input rounded-lg bg-[#182b34] border-[#315668] text-white h-12 px-3"
                            placeholder="Enter quantity"
                            value={sellQty}
                            onChange={(e) => setSellQty(e.target.value)}
                        />
                    </label>

                    {/* INFO */}
                    <div className="flex flex-col gap-1 text-sm">
                        <p className="text-[#90b7cb]">
                            Holding: <span className="text-white">{holding} {symbol.toUpperCase()}</span>
                        </p>

                        <p className="text-[#90b7cb]">
                            Current price:{" "}
                            <span className="text-white">
                                {currentPrice ? `$${currentPrice.toLocaleString()}` : "-"}
                            </span>
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="w-full h-12 rounded-lg bg-red-500 font-bold text-white"
                    >
                        SELL
                    </button>

                    {message && <p className="text-sm mt-2 text-white">{message}</p>}
                </form>
            )}
        </div>
    );
}
