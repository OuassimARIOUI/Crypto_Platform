"use client";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";

export default function PortfolioTransactions() {
    const [tx, setTx] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadTransactions() {
            try {
                const token = Cookies.get("token");
                if (!token) {
                    setError("Utilisateur non connecté");
                    setLoading(false);
                    return;
                }

                const res = await fetch("http://localhost:3004/portfolio/me", {
                    headers: {
                        Authorization: "Bearer " + token
                    }
                });

                const data = await res.json();

                if (!res.ok) {
                    setError(data.error || "Erreur chargement transactions");
                    return;
                }

                setTx(data.transactions || []);
            } catch (err) {
                console.error(err);
                setError("Erreur serveur");
            } finally {
                setLoading(false);
            }
        }

        loadTransactions();
    }, []);

    if (loading) return <p className="text-white">Chargement des transactions...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <table className="w-full">
                <thead className="bg-white/10">
                <tr>
                    <th className="px-6 py-4 text-left text-xs text-gray-400 uppercase">
                        Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-400 uppercase">
                        Asset
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-400 uppercase">
                        Quantity
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-400 uppercase">
                        Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-400 uppercase">
                        Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-400 uppercase">
                        Total
                    </th>
                </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                {tx.map((t) => {
                    const total = Number(t.price_usd) * Number(t.quantity);
                    const isBuy = t.type === "buy";

                    return (
                        <tr key={t.id} className="hover:bg-white/5">
                            <td className="px-6 py-4">
                  <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          isBuy
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                      }`}
                  >
                    {isBuy ? "Buy" : "Sell"}
                  </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-white">
                                {t.crypto?.name} ({t.crypto?.symbol?.toUpperCase()})
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-300">
                                {isBuy ? "+" : "-"}
                                {t.quantity} {t.crypto?.symbol?.toUpperCase()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-300">
                                ${Number(t.price_usd).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-300">
                                {new Date(t.timestamp).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-white font-semibold">
                                ${total.toLocaleString()}
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
}