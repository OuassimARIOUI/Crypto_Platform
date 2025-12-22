"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Notification from "@/components/ui/Notification";
import MessagingDock from "@/components/messaging/MessagingDock";



export default function DashboardLayout({ children }) {
    const [user, setUser] = useState(null);
    const pathname = usePathname();

    // Charger l'utilisateur depuis le backend grâce au token
    useEffect(() => {
        const token = Cookies.get("token");
        if (!token) return;

        fetch("http://localhost:3004/auth/me", {
            headers: {
                Authorization: "Bearer " + token,
            },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data?.error) return;
                setUser(data);
            })
            .catch((err) => console.error("ME ERROR:", err));
    }, []);

    return (
        <div className="flex min-h-screen w-full bg-background-dark text-white">
            {/* SIDEBAR */}
            <aside className="flex h-screen w-64 flex-col border-r border-white/10 bg-background-dark p-4">
                <div className="flex items-center gap-3 px-3 py-2">
                    <span className="material-symbols-outlined text-[#0da6f2] text-5xl">
                        currency_bitcoin
                    </span>
                    <h2 className="text-lg font-bold tracking-tight">CryptoApp</h2>
                </div>

                <nav className="mt-8 flex flex-col gap-2">
                    {[
                        { icon: "dashboard", label: "Dashboard", href: "/dashboard" },
                        { icon: "account_balance_wallet", label: "Portfolio", href: "/portfolio" },
                        { icon: "candlestick_chart", label: "Trading", href: "/trading", restricted: true },
                        { icon: "show_chart", label: "Indicators", href: "/indicators" },
                        { icon: "person", label: "Profile", href: "/profile" },

                        ...(user?.role === "admin" || user?.role === "moderator"
                            ? [{ icon: "group", label: "Users", href: "/users" }]
                            : []),
                        ...(user?.role === "admin"
                            ? [{ icon: "report", label: "Reports", href: "/reports" }]
                            : []),
                    ].map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        const isRestricted =
                            item.restricted && (user?.status === "banned" || user?.status === "suspended");

                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                aria-disabled={isRestricted}
                                tabIndex={isRestricted ? -1 : 0}
                                onClick={(e) => {
                                    if (isRestricted) e.preventDefault();
                                }}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition
                    ${
                                    isActive
                                        ? "bg-primary/20 text-primary"
                                        : isRestricted
                                            ? "text-gray-500 opacity-60 cursor-not-allowed"
                                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                                }
                `}
                            >
                <span
                    className={`material-symbols-outlined text-xl ${
                        isActive ? "text-primary" : ""
                    }`}
                >
                    {item.icon}
                </span>
                                <p className="text-sm font-medium">{item.label}</p>
                            </Link>
                        );
                    })}
                </nav>



                {/* Logout */}
                <div className="mt-auto">
                    <button
                        onClick={() => {
                            Cookies.remove("token");
                            window.location.href = "/login";
                        }}
                        className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-white/5 hover:text-white"
                    >
                        <span className="material-symbols-outlined text-xl">logout</span>
                        <p className="text-sm">Logout</p>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1">
                {/* Topbar */}
                <header className="flex h-16 items-center justify-end border-b border-white/10 px-6">
                    <div className="flex items-center gap-4">
                        <button className="h-10 w-10 bg-white/5 rounded-full flex items-center justify-center text-gray-300 hover:text-white">
                            <span className="material-symbols-outlined">notifications</span>
                        </button>

                        <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div
                                className="size-10 rounded-full bg-center bg-cover"
                            ></div>

                            {/* USER INFO */}
                            <div className="text-right">
                                <h1 className="text-sm font-medium">
                                    {user ? user.pseudo : "..."}
                                </h1>
                                <p className="text-xs text-gray-400">
                                    {user ? user.email : ""}
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                {(user?.status === "banned" || user?.status === "suspended") && (
                    <div className="border-b border-white/10 px-6 py-3">
                        <Notification
                            type="error"
                            message={`${String(user.status).toUpperCase()}: Your account is restricted. Trading and deposits are disabled.`}
                        />
                    </div>
                )}

                {children}

                {/* Bottom-right messaging overlay */}
                <MessagingDock me={user} />
            </main>
        </div>
    );
}
