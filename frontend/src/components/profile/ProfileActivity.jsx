"use client";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";

export default function ProfileActivity() {
    const [tx, setTx] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadPortfolio() {
            const token = Cookies.get("token");
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const res = await fetch("http://localhost:3004/portfolio/me", {
                    headers: { Authorization: "Bearer " + token }
                });

                const data = await res.json();

                if (res.ok) {
                    setTx(data.transactions || []);
                }
            } catch (e) {
                console.error("PORTFOLIO ERROR", e);
            } finally {
                setLoading(false);
            }
        }

        loadPortfolio();
    }, []);

    if (loading) return <p className="text-white">Chargement…</p>;

    return (
        <div className="rounded-xl border border-white/10 bg-white/5">
            <h2 className="text-white text-xl font-bold px-6 py-4 border-b border-white/10">
                Recent Activity
            </h2>

            <div className="p-4">
                {tx.length === 0 ? (
                    <p className="text-white/60 text-sm">Aucune transaction.</p>
                ) : (
                    tx.slice(0, 10).map(t => (
                        <div
                            key={t.id}
                            className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-white/5"
                        >
                            <div className="col-span-2 text-white">
                                {t.type.toUpperCase()}
                            </div>

                            <div className="col-span-4 text-white">
                                {t.crypto?.symbol?.toUpperCase()} – {t.quantity}
                            </div>

                            <div className="col-span-3 text-white/70">
                                ${Number(t.price_usd).toLocaleString()}
                            </div>

                            <div className="col-span-3 text-right text-white/50">
                                {new Date(t.timestamp).toLocaleString()}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
