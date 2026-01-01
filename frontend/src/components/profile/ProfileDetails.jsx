"use client";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

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

    const [pseudo, setPseudo] = useState("");
    const [message, setMessage] = useState("");

    // Vérifie si Discord est connecté via OAuth (pas juste un username manuel)
    const isDiscordLinked = Boolean(user?.discord_user_id);
    const discordUsername = user?.discord_username || "";

    useEffect(() => {
        const token = Cookies.get("token");
        if (!token) {
            setLoading(false);
            return;
        }

        async function loadData() {
            try {
                // --- Load User ---
                const resUser = await fetch("http://localhost:3004/auth/me", {
                    headers: { Authorization: "Bearer " + token }
                });
                const dataUser = await resUser.json();
                if (resUser.ok) {
                    setUser(dataUser);
                    setPseudo(dataUser.pseudo || "");
                }

                // --- Load Portfolio (balance) ---
                const resPort = await fetch("http://localhost:3004/portfolio/me", {
                    credentials: "include",
                    headers: { Authorization: "Bearer " + token }
                });
                const dataPort = await resPort.json();
                if (resPort.ok) setBalance(dataPort.balance || 0);

            } catch (e) {
                console.error("ERROR LOADING PROFILE DATA", e);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    async function refreshUser() {
        const token = Cookies.get("token");
        if (!token) return;

        const resUser = await fetch("http://localhost:3004/auth/me", {
            headers: { Authorization: "Bearer " + token }
        });
        const dataUser = await resUser.json();
        if (resUser.ok) {
            setUser(dataUser);
            setPseudo(dataUser.pseudo || "");
        }
    }

    async function saveProfile() {
        const token = Cookies.get("token");
        if (!token) return;

        setSaving(true);
        setMessage("");

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
            setMessage("Profile updated.");
        } catch (e) {
            setMessage(e.message || "Save failed");
        } finally {
            setSaving(false);
        }
    }

    async function connectDiscord() {
        const token = Cookies.get("token");
        if (!token) return;

        setMessage("");
        setConnectingDiscord(true);

        try {
            const res = await fetch("http://localhost:3004/discord/connect-url", {
                headers: { Authorization: "Bearer " + token }
            });
            const data = await res.json();
            if (!res.ok) {
                setMessage(data?.error || "Failed to start Discord connect");
                return;
            }

            window.location.href = data.url;
        } catch (e) {
            setMessage("Failed to connect Discord");
        } finally {
            setConnectingDiscord(false);
        }
    }

    async function disconnectDiscord() {
        const token = Cookies.get("token");
        if (!token) return;

        setMessage("");

        const res = await fetch("http://localhost:3004/discord/disconnect", {
            method: "POST",
            headers: { Authorization: "Bearer " + token }
        });
        const data = await res.json();
        if (!res.ok) {
            setMessage(data?.error || "Failed to disconnect Discord");
            return;
        }

        await refreshUser();
        setMessage("Discord disconnected.");
    }

    if (loading) return <p className="text-white">Chargement…</p>;

    return (
        <div className="glassmorphism rounded-xl">
            <h2 className="text-white text-[22px] font-bold px-6 pb-3 pt-5 border-b border-white/10">
                Account Details
            </h2>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">

                {/* Username */}
                <div className="flex flex-col gap-1">
                    <p className="text-white/60 text-sm">Username</p>
                    <p className="text-white text-base">{user.pseudo}</p>
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1">
                    <p className="text-white/60 text-sm">Email Address</p>
                    <p className="text-white text-base">{user.email}</p>
                </div>

                {/* Account Created */}
                <div className="flex flex-col gap-1">
                    <p className="text-white/60 text-sm">Account Created</p>
                    <p className="text-white text-base">
                        {new Date(user.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </p>
                </div>

                {/* Role */}
                <div className="flex flex-col gap-1">
                    <p className="text-white/60 text-sm">Role</p>
                    <p className="text-white text-base">
                        {user.role || "User"}
                    </p>
                </div>

                {/* BALANCE  */}
                <div className="flex flex-col gap-1">
                    <p className="text-white/60 text-sm">Portfolio Balance</p>
                    <p className="text-white text-xl font-bold">
                        ${balance.toLocaleString()}
                    </p>
                </div>

                {/* Discord - Section améliorée */}
                <div className="flex flex-col gap-1">
                    <p className="text-white/60 text-sm">Discord</p>
                    {isDiscordLinked ? (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5865F2]/20 border border-[#5865F2]/30">
                                <DiscordIcon className="w-4 h-4 text-[#5865F2]" />
                                <span className="text-white font-medium text-sm">
                                    {discordUsername}
                                </span>
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            </div>
                        </div>
                    ) : (
                        <p className="text-white/50 text-base">Not connected</p>
                    )}
                </div>

            </div>

            {/* Discord Connection Card - UI avancée */}
            <div className="mx-6 mb-6 p-4 rounded-xl bg-gradient-to-r from-[#5865F2]/10 to-[#5865F2]/5 border border-[#5865F2]/20">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-[#5865F2]/20">
                        <DiscordIcon className="w-8 h-8 text-[#5865F2]" />
                    </div>
                    
                    <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg">Discord Integration</h3>
                        
                        {isDiscordLinked ? (
                            <>
                                <p className="text-white/60 text-sm mt-1">
                                    Your account is linked to <span className="text-[#5865F2] font-medium">@{discordUsername}</span>
                                </p>
                                <p className="text-white/40 text-xs mt-2">
                                    You will receive price alerts and notifications via Discord DM.
                                </p>
                                
                                <div className="flex items-center gap-3 mt-4">
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                                        <span className="w-2 h-2 rounded-full bg-green-500" />
                                        <span className="text-green-400 text-xs font-medium">Connected</span>
                                    </div>
                                    
                                    <button
                                        type="button"
                                        onClick={disconnectDiscord}
                                        className="px-4 py-1.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-white/60 text-sm mt-1">
                                    Link your Discord account to receive price alerts via DM.
                                </p>
                                
                                <button
                                    type="button"
                                    onClick={connectDiscord}
                                    disabled={connectingDiscord}
                                    className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#5865F2]/25 hover:shadow-[#5865F2]/40"
                                >
                                    <DiscordIcon className="w-5 h-5" />
                                    {connectingDiscord ? "Connecting..." : "Connect Discord"}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit section */}
            <div className="px-6 pb-6 pt-2 border-t border-white/10 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Update username"
                        placeholder="Your username"
                        value={pseudo}
                        onChange={(e) => setPseudo(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="w-full md:w-auto">
                        <Button onClick={saveProfile} disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>

                {message && (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                        message.includes("disconnected") || message.includes("failed") || message.includes("Failed")
                            ? "bg-red-500/10 border border-red-500/20 text-red-400"
                            : "bg-green-500/10 border border-green-500/20 text-green-400"
                    }`}>
                        <span className="text-sm">{message}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
