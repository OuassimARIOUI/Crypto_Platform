"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menu = [
    { name: "Dashboard", icon: "dashboard", href: "/dashboard" },
    { name: "Portfolio", icon: "account_balance_wallet", href: "/portfolio" },
    { name: "Trading", icon: "candlestick_chart", href: "/trading" },
    { name: "Indicators", icon: "show_chart", href: "/indicators" },
    { name: "Profile", icon: "person", href: "/profile" },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 h-screen bg-[#101c22] border-r border-white/10 p-4 flex flex-col">
            <div className="flex items-center gap-3 px-3 py-4 text-white">
                <span className="material-symbols-outlined text-primary text-3xl">currency_bitcoin</span>
                <h1 className="text-xl font-bold">CryptoTrade</h1>
            </div>

            <nav className="flex flex-col gap-2 mt-6">
                {menu.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition 
              ${
                            pathname === item.href
                                ? "bg-primary/20 text-primary"
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                        }`}
                    >
                        <span className="material-symbols-outlined">{item.icon}</span>
                        {item.name}
                    </Link>
                ))}
            </nav>

            <div className="mt-auto">
                <button className="flex items-center gap-3 px-3 py-2 text-white/70 hover:bg-white/10 hover:text-white rounded-lg">
                    <span className="material-symbols-outlined">logout</span>
                    Logout
                </button>
            </div>
        </aside>
    );
}
