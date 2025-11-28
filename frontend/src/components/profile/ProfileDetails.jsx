"use client";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";

export default function ProfileDetails() {
    const [user, setUser] = useState(null);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);

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
                if (resUser.ok) setUser(dataUser);

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

            </div>
        </div>
    );
}
