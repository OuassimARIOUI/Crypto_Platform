"use client";
import { useEffect, useState } from "react";
import {NextResponse as res} from "next/server";
import Cookies from "js-cookie";

export default function PortfolioAssets() {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadAssets() {
            try {
                const token = Cookies.get("token");
                if (!token) {
                    setError("Utilisateur non connecté");
                    setLoading(false);
                    return;
                }

                // 1) Portfolio data
                const res = await fetch("http://localhost:3004/portfolio/me", {
                    headers: {
                        Authorization: "Bearer " + token,
                    },
                });

                const portfolio = await res.json();

                if (!res.ok) {
                    setError(portfolio.error || "Erreur chargement portefeuille");
                    setLoading(false);
                    return;
                }

                // 2) Prices
                const pricesRes = await fetch("http://localhost:3004/prices");
                const prices = await pricesRes.json();

                // 3) Build assets list
                const formatted = Object.entries(portfolio.holdings).map(([symbol, qty]) => {
                    const tx = portfolio.transactions.find(
                        (t) => t.crypto?.symbol === symbol
                    );

                    const cryptoId = tx?.crypto_id;
                    const priceRow = prices.find((p) => p.crypto_id === cryptoId);

                    const price = priceRow ? Number(priceRow.price_usd) : 0;
                    const variation = priceRow ? Number(priceRow.change_percent_24h || 0) : 0;

                    return {
                        name: tx?.crypto?.name || symbol.toUpperCase(),
                        symbol,
                        holding: qty,
                        price,
                        variation,
                        total: qty * price,
                    };
                });

                setAssets(formatted);
            } catch (err) {
                console.error(err);
                setError("Erreur serveur");
            } finally {
                setLoading(false);
            }
        }

        loadAssets();
    }, []);

    if (loading) return <p className="text-white">Chargement du portefeuille...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <table className="w-full">
                <thead className="bg-white/10">
                <tr>
                    <th className="px-6 py-4 text-left text-xs text-gray-400 uppercase">
                        Asset
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-400 uppercase">
                        Holdings
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-400 uppercase">
                        Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-400 uppercase">
                        Total Value
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-400 uppercase">
                        24h
                    </th>
                </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                {assets.map((a, idx) => (
                    <tr key={idx} className="hover:bg-white/5">
                        <td className="px-6 py-4 text-white">
                            {a.name} ({a.symbol.toUpperCase()})
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                            {a.holding} {a.symbol.toUpperCase()}
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                            ${a.price.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-white font-semibold">
                            ${a.total.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                <span
                    className={
                        a.variation >= 0 ? "text-green-400" : "text-red-400"
                    }
                >
                  {a.variation.toFixed(2)}%
                </span>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}