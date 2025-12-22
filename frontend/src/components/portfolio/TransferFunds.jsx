"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";

export default function TransferFunds() {
    const [mounted, setMounted] = useState(false);
    const [token, setToken] = useState(null);

    const [toPseudo, setToPseudo] = useState("");
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");

    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        setMounted(true);
        setToken(Cookies.get("token") || null);
    }, []);

    async function submit() {
        if (!token) return;
        const pseudo = toPseudo.trim();
        const amt = Number(amount);

        if (!pseudo) {
            setMessage("Erreur : pseudo requis");
            return;
        }
        if (!Number.isFinite(amt) || amt <= 0) {
            setMessage("Erreur : montant invalide");
            return;
        }

        setBusy(true);
        setMessage("");
        try {
            const res = await fetch("http://localhost:3004/portfolio/transfer", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + token,
                },
                body: JSON.stringify({
                    toPseudo: pseudo,
                    amount: amt,
                    reason: reason.trim() || undefined,
                }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || "Transfer failed");

            setMessage(`Transfert envoyé à @${pseudo} ✔️`);
            setToPseudo("");
            setAmount("");
            setReason("");
        } catch (e) {
            setMessage("Erreur : " + (e?.message || "Transfer failed"));
        } finally {
            setBusy(false);
        }
    }

    if (!mounted) return null;

    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-white text-xl font-bold mb-4">Transfer</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                    value={toPseudo}
                    onChange={(e) => setToPseudo(e.target.value)}
                    placeholder="Pseudo destinataire"
                    className="px-3 py-2 rounded-lg bg-black/30 text-white border border-white/20"
                />

                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Montant"
                    className="px-3 py-2 rounded-lg bg-black/30 text-white border border-white/20"
                />

                <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Motif (optionnel)"
                    className="px-3 py-2 rounded-lg bg-black/30 text-white border border-white/20"
                />
            </div>

            <div className="mt-3">
                <button
                    onClick={submit}
                    disabled={busy || !token}
                    className="px-4 py-2 rounded-lg bg-primary text-black font-bold hover:bg-primary/80 disabled:opacity-60"
                >
                    {busy ? "Envoi..." : "Envoyer"}
                </button>
            </div>

            {message && <p className="text-white mt-3">{message}</p>}
        </div>
    );
}
