"use client";
import { useEffect, useState } from "react";

export default function ProfileActivity() {
    const [tx, setTx] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                fetch(URL, { credentials: "include" })
                if (!token) {
                    setLoading(false);
                    return;
                }

                fetch("http://localhost:3001/portfolio/me", {
                    credentials: "include"
                });


                const data = await res.json();
                if (res.ok) {
                    setTx(data.transactions || []);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }

        load();
    }, []);

    if (loading) return <p className="text-white">Chargement...</p>;

    return (
        <div className="glassmorphism rounded-xl border border-white/10 bg-white/5">
            <h2 className="text-white text-[22px] font-bold px-6 pb-3 pt-5 border-b border-white/10">
                Recent Activity
            </h2>
            <div className="p-4">
                {tx.length === 0 ? (
                    <p className="text-white/60 text-sm">Aucune transaction.</p>
                ) : (
                    <div className="flex flex-col">
                        {tx.slice(0, 10).map((t) => (
                            <div
                                key={t.id}
                                className="grid grid-cols-12 items-center gap-4 px-4 py-3 border-b border-white/10"
                            >
                                <div className="col-span-2 text-sm text-white">
                                    {t.type === "buy" ? "Buy" : "Sell"}
                                </div>
                                <div className="col-span-4 text-sm text-white">
                                    {t.crypto?.symbol?.toUpperCase()} – {t.quantity}
                                </div>
                                <div className="col-span-3 text-sm text-white/70">
                                    ${Number(t.price_usd).toLocaleString()}
                                </div>
                                <div className="col-span-3 text-sm text-white/50 text-right">
                                    {new Date(t.timestamp).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
