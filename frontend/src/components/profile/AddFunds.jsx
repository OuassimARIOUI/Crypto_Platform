"use client";
import { useState } from "react";
import Cookies from "js-cookie";

export default function AddFunds() {
    const [amount, setAmount] = useState("");
    const [message, setMessage] = useState("");

    async function addCredit() {
        const token = Cookies.get("token");
        if (!token) return;

        const res = await fetch("http://localhost:3004/portfolio/add-funds", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },
            body: JSON.stringify({ amount: Number(amount) })
        });

        const data = await res.json();

        if (res.ok) {
            setMessage("Crédit ajouté ✔️ Nouveau solde : $" + data.balance);
        } else {
            setMessage("Erreur : " + data.error);
        }
    }

    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-white text-xl font-bold mb-4">Add Credit</h2>

            <div className="flex gap-3">
                <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="Montant"
                    className="px-3 py-2 rounded-lg bg-black/30 text-white border border-white/20"
                />

                <button
                    onClick={addCredit}
                    className="px-4 py-2 rounded-lg bg-primary text-black font-bold hover:bg-primary/80"
                >
                    Ajouter
                </button>
            </div>

            {message && <p className="text-white mt-3">{message}</p>}
        </div>
    );
}
