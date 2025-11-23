"use client";
import { useState, useEffect } from "react";

export default function TradingBuyCard() {
    const [symbol, setSymbol] = useState("btc");
    const [amountUsd, setAmountUsd] = useState("");
    const [currentPrice, setCurrentPrice] = useState(null);
    const [balance, setBalance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    // Charger balance + prix
    useEffect(() => {
        async function loadData() {
            try {
                fetch(URL, { credentials: "include" })
                if (!token) return;

                const [portfolioRes, pricesRes] = await Promise.all([
                    fetch("http://localhost:3001/portfolio/me", {
                        credentials: "include"
                    }),
                    fetch("http://localhost:3001/prices"),
                ]);

                const portfolio = await portfolioRes.json();
                const prices = await pricesRes.json();

                if (portfolioRes.ok) setBalance(portfolio.balance);

                const targetPrice = prices.find((p) => {
                    // crypto info dans les transactions
                    const tx = portfolio.transactions.find(
                        (t) => t.crypto && t.crypto.symbol === symbol
                    );
                    if (!tx) return false;
                    return p.crypto_id === tx.crypto_id;
                });

                if (targetPrice) {
                    setCurrentPrice(Number(targetPrice.price_usd));
                }

                setLoading(false);
            } catch (e) {
                console.error(e);
                setLoading(false);
            }
        }

        loadData();
    }, [symbol]);

    async function handleBuy(e) {
        e.preventDefault();
        setMessage("");

        try
        {
            fetch(URL, { credentials: "include" })
            if (!token) {
                setMessage("Connexion requise");
                return;
            }

            if (!currentPrice || !amountUsd) {
                setMessage("Montant ou prix invalide");
                return;
            }

            const quantity = Number(amountUsd) / currentPrice;

            const res = await fetch("http://localhost:3001/portfolio/buy", {
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

            setBalance(data.balance);
            setMessage("Achat effectué avec succès ");
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
                                <option value="btc">Bitcoin (BTC)</option>
                                <option value="eth">Ethereum (ETH)</option>
                                <option value="sol">Solana (SOL)</option>
                            </select>
                        </label>

                        <label className="flex flex-col w-full">
                            <p className="text-white text-base font-medium pb-2">
                                Amount (USD)
                            </p>
                            <input
                                type="number"
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
