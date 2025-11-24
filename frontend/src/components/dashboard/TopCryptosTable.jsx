"use client";
import { useEffect, useState } from "react";
import CryptoRow from "./CryptoRow";

export default function TopCryptosTable() {
    const [cryptos, setCryptos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadCryptos() {
            try {
                const res = await fetch("http://localhost:3001/cryptos");
                const data = await res.json();
                setCryptos(data);
            } catch (err) {
                console.error("Erreur chargement cryptos :", err);
            } finally {
                setLoading(false);
            }
        }

        loadCryptos();
    }, []);

    if (loading) return <p className="text-white">Chargement...</p>;

    return (
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-lg overflow-hidden">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-white/10 text-gray-400 text-xs uppercase">
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">24h %</th>
                        <th className="px-4 py-3">Last 7 Days</th>
                    </tr>
                </thead>

                <tbody>
                    {cryptos.map((c, i) => (
                        <CryptoRow
                            key={c.id}
                            crypto={{
                                id: c.id,
                                name: c.name,
                                symbol: c.symbol,
                                price: c.current_price,
                                change: c.price_change_percentage_24h,
                                sparkline: c.sparkline7d,
                                logo: c.image,
                            }}
                            index={i + 1}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
