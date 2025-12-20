"use client";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ProfileDetails() {
    const [user, setUser] = useState(null);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [pseudo, setPseudo] = useState("");
    const [discordUsername, setDiscordUsername] = useState("");
    const [message, setMessage] = useState("");

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
                    setDiscordUsername(dataUser.discord_username || "");
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
            setDiscordUsername(dataUser.discord_username || "");
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
                body: JSON.stringify({ pseudo, discordUsername }),
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

        const res = await fetch("http://localhost:3004/discord/connect-url", {
            headers: { Authorization: "Bearer " + token }
        });
        const data = await res.json();
        if (!res.ok) {
            setMessage(data?.error || "Failed to start Discord connect");
            return;
        }

        window.location.href = data.url;
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

                {/* Discord */}
                <div className="flex flex-col gap-1">
                    <p className="text-white/60 text-sm">Discord</p>
                    <p className="text-white text-base">
                        {user.discord_user_id ? "Connected" : "Not connected"}
                    </p>
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
                    <Input
                        label="Discord username (display)"
                        placeholder="ex: mydiscord"
                        value={discordUsername}
                        onChange={(e) => setDiscordUsername(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="w-full md:w-auto">
                        <Button onClick={saveProfile} disabled={saving}>
                            {saving ? "Saving..." : "Save"}
                        </Button>
                    </div>

                    <button
                        type="button"
                        onClick={connectDiscord}
                        className="h-12 px-4 rounded-lg border border-white/10 bg-white/10 text-white hover:bg-white/20 transition-colors"
                    >
                        Connect Discord
                    </button>

                    {user.discord_user_id && (
                        <button
                            type="button"
                            onClick={disconnectDiscord}
                            className="h-12 px-4 rounded-lg border border-white/10 bg-black/30 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                        >
                            Disconnect
                        </button>
                    )}
                </div>

                {message && (
                    <p className="text-white/70 text-sm">{message}</p>
                )}

                <p className="text-white/50 text-xs">
                    Note: sending Discord DMs requires linking your Discord account (Connect Discord). The username field alone is not enough for DM delivery.
                </p>
            </div>
        </div>
    );
}
