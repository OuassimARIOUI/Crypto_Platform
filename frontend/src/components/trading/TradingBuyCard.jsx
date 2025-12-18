"use client";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";

export default function TradingBuyCard() {
    const [symbol, setSymbol] = useState("btc");
    const [amountUsd, setAmountUsd] = useState("");
    const [currentPrice, setCurrentPrice] = useState(null);
    const [balance, setBalance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [holding, setHolding] = useState(0);
    const [cryptos, setCryptos] = useState([]);

    useEffect(() => {
        async function loadData() {
            try {
                const token = Cookies.get("token");
                if (!token) {
                    setLoading(false);
                    return;
                }

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

                // Quantité détenue
                const qty = holdings[symbol] ?? 0;
                setHolding(qty);

                // Trouver le bon crypto_id via la liste /cryptos
                const crypto = cryptos.find(c => c.symbol === symbol);

                if (crypto) {
                    const priceRow = prices.find(p => p.crypto_id === crypto.id);

                    if (priceRow) {
                        setCurrentPrice(Number(priceRow.price_usd));
                    } else {
                        setCurrentPrice(null);
                    }
                } else {
                    setCurrentPrice(null);
                }


                setBalance(portfolio.balance);
                setLoading(false);
            } catch (e) {
                console.error("Error BUY load", e);
                setLoading(false);
            }
        }

        if (cryptos.length > 0) loadData();
    }, [symbol, cryptos]);

    useEffect(() => {
        fetch("http://localhost:3004/cryptos")
            .then(res => res.json())
            .then(data => setCryptos(data));
    }, []);


    async function handleBuy(e) {
        e.preventDefault();
        setMessage("");

        try {
            const token = Cookies.get("token");
            if (!token) {
                setMessage("Connexion requise");
                return;
            }

            if (!currentPrice || !amountUsd) {
                setMessage("Montant ou prix invalide");
                return;
            }

            const quantity = Number(amountUsd) / currentPrice;

            const res = await fetch("http://localhost:3004/portfolio/buy", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    symbol,
                    quantity,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.error || "Erreur lors de l'achat");
                return;
            }

            // Mise à jour instantanée
            setBalance(data.balance);
            setHolding(prev => prev + quantity);

            setMessage("Achat effectué avec succès !");
            setAmountUsd("");
        } catch (err) {
            console.error(err);
            setMessage("Erreur serveur");
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6 rounded-xl border border-[#315668]/50 bg-[#182b34]/70">
            <p className="text-white text-xl font-bold">Buy</p>

            {loading ? (
                <p className="text-white">Chargement...</p>
            ) : (
                <>
                    <form className="space-y-4" onSubmit={handleBuy}>
                        <label className="flex flex-col w-full">
                            <p className="text-white text-base font-medium pb-2">
                                Cryptocurrency
                            </p>
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

                        <label className="flex flex-col w-full">
                            <p className="text-white text-base font-medium pb-2">
                                Amount (USD)
                            </p>
                            <input
                                type="float"
                                min="0"
                                className="form-input rounded-lg bg-[#182b34] border-[#315668] text-white h-12 px-3"
                                placeholder="Enter amount"
                                value={amountUsd}
                                onChange={(e) => setAmountUsd(e.target.value)}
                            />
                        </label>

                        <div className="flex flex-col gap-1 text-sm">
                            <p className="text-[#90b7cb]">
                                Balance:{" "}
                                <span className="text-white">
                                    {balance !== null ? `$${balance.toFixed(2)}` : "-"}
                                </span>
                            </p>

                            <p className="text-[#90b7cb]">
                                You own:{" "}
                                <span className="text-white">
                                    {holding} {symbol.toUpperCase()}
                                </span>
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
                            className="w-full h-12 rounded-lg bg-[#0bda57] font-bold text-black"
                        >
                            BUY
                        </button>
                    </form>

                    {message && <p className="text-sm mt-2 text-white">{message}</p>}
                </>
            )}
        </div>
    );
}
