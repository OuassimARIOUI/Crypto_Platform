"use client";
import React, { useEffect, useState, useMemo } from "react";
import Cookies from "js-cookie";

// Icône Discord SVG
const DiscordIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
);

export default function ProfileDetails() {
    const [user, setUser] = useState(null);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [connectingDiscord, setConnectingDiscord] = useState(false);

    // Valeurs éditables
    const [pseudo, setPseudo] = useState("");
    const [addAmount, setAddAmount] = useState("");
    
    // États d'édition inline
    const [editingPseudo, setEditingPseudo] = useState(false);
    const [editingBalance, setEditingBalance] = useState(false);
    
    // Messages
    const [message, setMessage] = useState({ text: "", type: "" });

    // Valeurs originales pour détecter les changements
    const [originalPseudo, setOriginalPseudo] = useState("");

    // Vérifie si Discord est connecté via OAuth
    const isDiscordLinked = Boolean(user?.discord_user_id);
    const discordUsername = user?.discord_username || "";

    // Détecter si des changements ont été faits
    const hasChanges = useMemo(() => {
        return pseudo !== originalPseudo;
    }, [pseudo, originalPseudo]);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const token = Cookies.get("token");
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const [resUser, resPort] = await Promise.all([
                fetch("http://localhost:3004/auth/me", {
                    headers: { Authorization: "Bearer " + token }
                }),
                fetch("http://localhost:3004/portfolio/me", {
                    credentials: "include",
                    headers: { Authorization: "Bearer " + token }
                })
            ]);

            const dataUser = await resUser.json();
            const dataPort = await resPort.json();

            if (resUser.ok) {
                setUser(dataUser);
                setPseudo(dataUser.pseudo || "");
                setOriginalPseudo(dataUser.pseudo || "");
            }

            if (resPort.ok) {
                setBalance(dataPort.balance || 0);
            }
        } catch (e) {
            console.error("ERROR LOADING PROFILE DATA", e);
        } finally {
            setLoading(false);
        }
    }

    async function saveChanges() {
        const token = Cookies.get("token");
        if (!token) return;

        setSaving(true);
        setMessage({ text: "", type: "" });

        try {
            const res = await fetch("http://localhost:3004/auth/me", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + token,
                },
                body: JSON.stringify({ pseudo }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Save failed");

            setUser(data.user);
            setOriginalPseudo(pseudo);
            setEditingPseudo(false);
            setMessage({ text: "Profile updated successfully!", type: "success" });
            
            setTimeout(() => setMessage({ text: "", type: "" }), 3000);
        } catch (e) {
            setMessage({ text: e.message || "Save failed", type: "error" });
        } finally {
            setSaving(false);
        }
    }

    async function addFunds() {
        const token = Cookies.get("token");
        if (!token || !addAmount) return;

        try {
            const res = await fetch("http://localhost:3004/portfolio/add-funds", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + token
                },
                body: JSON.stringify({ amount: Number(addAmount) })
            });

            const data = await res.json();

            if (res.ok) {
                setBalance(data.balance);
                setAddAmount("");
                setEditingBalance(false);
                setMessage({ text: `$${Number(addAmount).toLocaleString()} added successfully!`, type: "success" });
                setTimeout(() => setMessage({ text: "", type: "" }), 3000);
            } else {
                setMessage({ text: data.error || "Failed to add funds", type: "error" });
            }
        } catch (e) {
            setMessage({ text: "Failed to add funds", type: "error" });
        }
    }

    async function connectDiscord() {
        const token = Cookies.get("token");
        if (!token) return;

        setMessage({ text: "", type: "" });
        setConnectingDiscord(true);

        try {
            const res = await fetch("http://localhost:3004/discord/connect-url", {
                headers: { Authorization: "Bearer " + token }
            });
            const data = await res.json();
            if (!res.ok) {
                setMessage({ text: data?.error || "Failed to start Discord connect", type: "error" });
                return;
            }
            window.location.href = data.url;
        } catch (e) {
            setMessage({ text: "Failed to connect Discord", type: "error" });
        } finally {
            setConnectingDiscord(false);
        }
    }

    async function disconnectDiscord() {
        const token = Cookies.get("token");
        if (!token) return;

        const res = await fetch("http://localhost:3004/discord/disconnect", {
            method: "POST",
            headers: { Authorization: "Bearer " + token }
        });
        const data = await res.json();
        if (!res.ok) {
            setMessage({ text: data?.error || "Failed to disconnect Discord", type: "error" });
            return;
        }

        await loadData();
        setMessage({ text: "Discord disconnected", type: "success" });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }

    function cancelChanges() {
        setPseudo(originalPseudo);
        setEditingPseudo(false);
    }

    if (loading) {
        return (
            <div className="glassmorphism rounded-xl p-8 flex items-center justify-center">
                <div className="flex items-center gap-3 text-white">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-primary rounded-full animate-spin" />
                    <span>Loading profile...</span>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="glassmorphism rounded-xl p-8 text-center text-white/60">
                Unable to load profile. Please try again.
            </div>
        );
    }

    return (
        <div className="glassmorphism rounded-xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-white text-[22px] font-bold">Account Details</h2>
                {user.role && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                            : user.role === 'moderator'
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                : 'bg-primary/20 text-primary border border-primary/30'
                    }`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                )}
            </div>

            {/* Message de notification */}
            {message.text && (
                <div className={`mx-6 mt-4 flex items-center gap-2 px-4 py-3 rounded-lg ${
                    message.type === "error"
                        ? "bg-red-500/10 border border-red-500/20 text-red-400"
                        : "bg-green-500/10 border border-green-500/20 text-green-400"
                }`}>
                    <span className="material-symbols-outlined text-lg">
                        {message.type === "error" ? "error" : "check_circle"}
                    </span>
                    <span className="text-sm">{message.text}</span>
                </div>
            )}

            {/* Contenu principal */}
            <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    
                    {/* Username - Éditable */}
                    <div className="group p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-white/50 text-xs uppercase tracking-wider font-medium">Username</p>
                            {!editingPseudo && (
                                <button 
                                    onClick={() => setEditingPseudo(true)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all"
                                >
                                    <span className="material-symbols-outlined text-lg">edit</span>
                                </button>
                            )}
                        </div>
                        {editingPseudo ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={pseudo}
                                    onChange={(e) => setPseudo(e.target.value)}
                                    className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-primary/50 text-white focus:outline-none focus:border-primary"
                                    autoFocus
                                />
                                <button 
                                    onClick={() => setEditingPseudo(false)}
                                    className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-all"
                                >
                                    <span className="material-symbols-outlined text-lg">check</span>
                                </button>
                                <button 
                                    onClick={cancelChanges}
                                    className="p-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-all"
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            </div>
                        ) : (
                            <p className="text-white text-lg font-semibold">{user.pseudo}</p>
                        )}
                    </div>

                    {/* Email - Non éditable */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-white/50 text-xs uppercase tracking-wider font-medium mb-2">Email Address</p>
                        <p className="text-white text-lg">{user.email}</p>
                    </div>

                    {/* Balance - Éditable (Add Funds) */}
                    <div className="group p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-white/50 text-xs uppercase tracking-wider font-medium">Portfolio Balance</p>
                            {!editingBalance && (
                                <button 
                                    onClick={() => setEditingBalance(true)}
                                    className="opacity-0 group-hover:opacity-100 px-3 py-1 rounded-lg bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 transition-all flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-sm">add</span>
                                    Add Funds
                                </button>
                            )}
                        </div>
                        <p className="text-white text-2xl font-bold">${balance.toLocaleString()}</p>
                        
                        {editingBalance && (
                            <div className="mt-3 pt-3 border-t border-primary/20">
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">$</span>
                                        <input
                                            type="number"
                                            value={addAmount}
                                            onChange={(e) => setAddAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full pl-7 pr-3 py-2 rounded-lg bg-black/30 border border-primary/50 text-white focus:outline-none focus:border-primary"
                                            autoFocus
                                        />
                                    </div>
                                    <button 
                                        onClick={addFunds}
                                        disabled={!addAmount || Number(addAmount) <= 0}
                                        className="px-4 py-2 rounded-lg bg-primary text-black font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Add
                                    </button>
                                    <button 
                                        onClick={() => { setAddAmount(""); setEditingBalance(false); }}
                                        className="p-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-all"
                                    >
                                        <span className="material-symbols-outlined text-lg">close</span>
                                    </button>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    {[100, 500, 1000, 5000].map((amount) => (
                                        <button
                                            key={amount}
                                            onClick={() => setAddAmount(amount.toString())}
                                            className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm hover:bg-white/10 hover:text-white transition-all"
                                        >
                                            ${amount.toLocaleString()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Account Created */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-white/50 text-xs uppercase tracking-wider font-medium mb-2">Member Since</p>
                        <p className="text-white text-lg">
                            {new Date(user.created_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </p>
                    </div>

                </div>

                {/* Discord Section */}
                <div className="mt-6 p-5 rounded-xl bg-gradient-to-r from-[#5865F2]/10 to-[#5865F2]/5 border border-[#5865F2]/20">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-[#5865F2]/20 shrink-0">
                            <DiscordIcon className="w-7 h-7 text-[#5865F2]" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="text-white font-semibold text-lg">Discord</h3>
                                {isDiscordLinked && (
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-green-400 text-xs font-medium">Connected</span>
                                    </div>
                                )}
                            </div>
                            
                            {isDiscordLinked ? (
                                <div className="mt-2">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#5865F2]/20 border border-[#5865F2]/30">
                                        <DiscordIcon className="w-4 h-4 text-[#5865F2]" />
                                        <span className="text-white font-medium">@{discordUsername}</span>
                                    </div>
                                    <p className="text-white/40 text-xs mt-2">
                                        You will receive price alerts via Discord DM.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={disconnectDiscord}
                                        className="mt-3 px-4 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                                    >
                                        Disconnect Discord
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-2">
                                    <p className="text-white/50 text-sm">
                                        Link your Discord to receive price alerts via DM.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={connectDiscord}
                                        disabled={connectingDiscord}
                                        className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#5865F2]/25 hover:shadow-[#5865F2]/40"
                                    >
                                        <DiscordIcon className="w-5 h-5" />
                                        {connectingDiscord ? "Connecting..." : "Connect Discord"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer avec Save Changes - Visible seulement si changements */}
            {hasChanges && (
                <div className="px-6 py-4 bg-primary/5 border-t border-primary/20 flex items-center justify-between">
                    <p className="text-white/60 text-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                        You have unsaved changes
                    </p>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={cancelChanges}
                            className="px-4 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={saveChanges}
                            disabled={saving}
                            className="px-6 py-2 rounded-lg bg-primary text-black font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg">save</span>
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
