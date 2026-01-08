"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";

const SendIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
);

const UserIcon = () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const DollarIcon = () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const MessageIcon = () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

export default function TransferFunds() {
    const [mounted, setMounted] = useState(false);
    const [token, setToken] = useState(null);

    const [toPseudo, setToPseudo] = useState("");
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");

    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        setMounted(true);
        setToken(Cookies.get("token") || null);
    }, []);

    async function submit() {
        if (!token) return;
        const pseudo = toPseudo.trim();
        const amt = Number(amount);

        if (!pseudo) {
            setMessage("Please enter a recipient username");
            setIsSuccess(false);
            return;
        }
        if (!Number.isFinite(amt) || amt <= 0) {
            setMessage("Please enter a valid amount");
            setIsSuccess(false);
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

            setMessage(`Successfully sent $${amt.toLocaleString()} to @${pseudo}`);
            setIsSuccess(true);
            setToPseudo("");
            setAmount("");
            setReason("");
        } catch (e) {
            setMessage(e?.message || "Transfer failed");
            setIsSuccess(false);
        } finally {
            setBusy(false);
        }
    }

    if (!mounted) return null;

    const quickAmounts = [50, 100, 250, 500];

    return (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary">
                    <SendIcon />
                </div>
                <div>
                    <h2 className="text-white text-lg font-bold">Transfer Funds</h2>
                    <p className="text-gray-400 text-sm">Send money to another user</p>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Recipient */}
                    <div className="relative">
                        <label className="block text-gray-400 text-xs mb-2 uppercase tracking-wider">Recipient</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <UserIcon />
                            </div>
                            <input
                                value={toPseudo}
                                onChange={(e) => setToPseudo(e.target.value)}
                                placeholder="Enter username"
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/30 text-white border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-colors placeholder:text-gray-500"
                            />
                        </div>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-gray-400 text-xs mb-2 uppercase tracking-wider">Amount</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <DollarIcon />
                            </div>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/30 text-white border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-colors placeholder:text-gray-500"
                            />
                        </div>
                        {/* Quick amounts */}
                        <div className="flex gap-2 mt-2">
                            {quickAmounts.map((amt) => (
                                <button
                                    key={amt}
                                    onClick={() => setAmount(amt.toString())}
                                    className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                                        amount === amt.toString()
                                            ? "border-primary bg-primary/20 text-primary"
                                            : "border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
                                    }`}
                                >
                                    ${amt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-gray-400 text-xs mb-2 uppercase tracking-wider">Note (optional)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MessageIcon />
                            </div>
                            <input
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Add a note..."
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/30 text-white border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-colors placeholder:text-gray-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Message */}
                {message && (
                    <div className={`mt-4 px-4 py-3 rounded-xl flex items-center gap-2 ${
                        isSuccess 
                            ? "bg-green-500/10 border border-green-500/30 text-green-400" 
                            : "bg-red-500/10 border border-red-500/30 text-red-400"
                    }`}>
                        {isSuccess ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        <span className="text-sm">{message}</span>
                    </div>
                )}

                {/* Submit button */}
                <div className="mt-6">
                    <button
                        onClick={submit}
                        disabled={busy || !token || !toPseudo.trim() || !amount}
                        className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-black font-bold hover:from-primary/90 hover:to-primary/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        {busy ? (
                            <>
                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>Sending...</span>
                            </>
                        ) : (
                            <>
                                <SendIcon />
                                <span>Send Transfer</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
