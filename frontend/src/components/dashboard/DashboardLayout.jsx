"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Cookies from "js-cookie";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Notification from "@/components/ui/Notification";
import MessagingDock from "@/components/messaging/MessagingDock";
import ThemeToggleButton from "@/components/theme/ThemeToggleButton";

// SidebarContent extracted outside of the main component to avoid recreating on each render
function SidebarContent({ collapsed, onNavigate, showBrand = true, navItems, pathname, user, sidebarCollapsed, onToggleCollapse }) {
    return (
        <>
            {showBrand && (
                <div className={`flex items-center gap-3 px-3 py-2 ${collapsed ? "justify-center" : ""}`}>
                    <span className="material-symbols-outlined text-[#0da6f2] text-5xl">currency_bitcoin</span>
                    {!collapsed && <h2 className="text-lg font-bold tracking-tight">CryptoApp</h2>}

                    <div className="ml-auto hidden lg:flex">
                        <button
                            type="button"
                            onClick={onToggleCollapse}
                            className="h-9 w-9 rounded-md text-gray-400 hover:bg-white/5 hover:text-white flex items-center justify-center"
                            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                            title={sidebarCollapsed ? "Expand" : "Collapse"}
                        >
                            <span className="material-symbols-outlined text-xl">
                                {sidebarCollapsed ? "chevron_right" : "chevron_left"}
                            </span>
                        </button>
                    </div>
                </div>
            )}

            <nav className={`mt-8 flex flex-col gap-2 ${collapsed ? "items-center" : ""}`}>
                {navItems.map((item) => {
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
                                if (isRestricted) {
                                    e.preventDefault();
                                    return;
                                }
                                onNavigate?.();
                            }}
                            title={collapsed ? item.label : undefined}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition w-full
                                ${collapsed ? "justify-center" : ""}
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
                                className={`material-symbols-outlined text-xl ${isActive ? "text-primary" : ""}`}
                            >
                                {item.icon}
                            </span>
                            {!collapsed && <p className="text-sm font-medium">{item.label}</p>}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className={`mt-auto ${collapsed ? "flex justify-center" : ""}`}>
                <button
                    onClick={() => {
                        Cookies.remove("token");
                        window.location.href = "/login";
                    }}
                    className={`flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-white/5 hover:text-white rounded-lg w-full
                        ${collapsed ? "justify-center" : ""}
                    `}
                    title={collapsed ? "Logout" : undefined}
                >
                    <span className="material-symbols-outlined text-xl">logout</span>
                    {!collapsed && <p className="text-sm">Logout</p>}
                </button>
            </div>
        </>
    );
}

export default function DashboardLayout({ children }) {
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const pathname = usePathname();
    const prevPathname = useRef(pathname);

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

    // Close mobile drawer when route changes
    useEffect(() => {
        if (prevPathname.current !== pathname) {
            prevPathname.current = pathname;
            setSidebarOpen(false);
        }
    }, [pathname]);

    // Prevent background scroll when mobile drawer is open
    useEffect(() => {
        if (!sidebarOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [sidebarOpen]);

    const handleToggleCollapse = useCallback(() => {
        setSidebarCollapsed((v) => !v);
    }, []);

    const handleCloseSidebar = useCallback(() => {
        setSidebarOpen(false);
    }, []);

    const navItems = [
        { icon: "dashboard", label: "Dashboard", href: "/dashboard" },
        { icon: "account_balance_wallet", label: "Portfolio", href: "/portfolio" },
        { icon: "candlestick_chart", label: "Trading", href: "/trading", restricted: true },
        { icon: "show_chart", label: "Indicators", href: "/indicators" },
        { icon: "person", label: "Profile", href: "/profile" },
        ...(user?.role === "admin" || user?.role === "moderator"
            ? [{ icon: "group", label: "Users", href: "/users" }]
            : []),
        ...(user?.role === "admin" ? [{ icon: "report", label: "Reports", href: "/reports" }] : []),
    ];

    return (
        <div className="flex min-h-screen w-full bg-background-dark text-white">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <button
                    type="button"
                    aria-label="Close menu"
                    onClick={handleCloseSidebar}
                    className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
                />
            )}

            {/* Mobile drawer */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 h-screen border-r border-white/10 bg-background-dark p-4 transform transition-transform duration-200 ease-out lg:hidden
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                    w-72
                `}
                role="dialog"
                aria-modal="true"
                aria-label="Sidebar"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 px-3 py-2">
                        <span className="material-symbols-outlined text-[#0da6f2] text-5xl">currency_bitcoin</span>
                        <h2 className="text-lg font-bold tracking-tight">CryptoApp</h2>
                    </div>
                    <button
                        type="button"
                        onClick={handleCloseSidebar}
                        className="h-10 w-10 rounded-md text-gray-300 hover:bg-white/5 hover:text-white flex items-center justify-center"
                        aria-label="Close menu"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="mt-2 flex h-[calc(100vh-72px)] flex-col">
                    <SidebarContent
                        collapsed={false}
                        showBrand={false}
                        onNavigate={handleCloseSidebar}
                        navItems={navItems}
                        pathname={pathname}
                        user={user}
                        sidebarCollapsed={sidebarCollapsed}
                        onToggleCollapse={handleToggleCollapse}
                    />
                </div>
            </aside>

            {/* Desktop sidebar */}
            <aside
                className={`hidden lg:flex h-screen flex-col border-r border-white/10 bg-background-dark p-4 transition-[width] duration-200
                    ${sidebarCollapsed ? "w-20" : "w-64"}
                `}
            >
                <SidebarContent
                    collapsed={sidebarCollapsed}
                    navItems={navItems}
                    pathname={pathname}
                    user={user}
                    sidebarCollapsed={sidebarCollapsed}
                    onToggleCollapse={handleToggleCollapse}
                />
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 min-w-0">
                {/* Topbar */}
                <header className="flex h-16 items-center justify-between lg:justify-end border-b border-white/10 px-4 sm:px-6">
                    <div className="lg:hidden">
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(true)}
                            className="h-10 w-10 bg-white/5 rounded-full flex items-center justify-center text-gray-300 hover:text-white"
                            aria-label="Open menu"
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <ThemeToggleButton className="h-10 w-10 bg-white/5 rounded-full flex items-center justify-center text-gray-300 hover:text-white" />

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
