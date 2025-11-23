export default function DashboardLayout({ children }) {
    return (
        <div className="flex min-h-screen w-full bg-background-dark text-white">
            {/* SIDEBAR */}
            <aside className="flex h-screen w-64 flex-col border-r border-white/10 bg-background-dark p-4">
                <div className="flex items-center gap-3 px-3 py-2">
          <span className="material-symbols-outlined text-primary text-3xl">
            currency_bitcoin
          </span>
                    <h2 className="text-lg font-bold tracking-tight">CryptoApp</h2>
                </div>

                <nav className="mt-8 flex flex-col gap-2">
                    {[
                        { icon: "dashboard", label: "Dashboard", active: true },
                        { icon: "account_balance_wallet", label: "Portfolio" },
                        { icon: "candlestick_chart", label: "Trading" },
                        { icon: "show_chart", label: "Indicators" },
                        { icon: "person", label: "Profile" },
                    ].map((item) => (
                        <a
                            key={item.label}
                            href="#"
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                                item.active
                                    ? "bg-primary/20 text-primary"
                                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                            }`}
                        >
              <span className="material-symbols-outlined text-xl">
                {item.icon}
              </span>
                            <p className="text-sm font-medium">{item.label}</p>
                        </a>
                    ))}
                </nav>

                {/* Logout */}
                <div className="mt-auto">
                    <a className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-white/5 hover:text-white">
                        <span className="material-symbols-outlined text-xl">logout</span>
                        <p className="text-sm">Logout</p>
                    </a>
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
                            <div
                                className="size-10 rounded-full bg-center bg-cover"
                                style={{
                                    backgroundImage:
                                        'url("https://i.pravatar.cc/100?img=12")',
                                }}
                            ></div>
                            <div className="text-right">
                                <h1 className="text-sm font-medium">Alex Doe</h1>
                                <p className="text-xs text-gray-400">user@email.com</p>
                            </div>
                        </div>
                    </div>
                </header>

                {children}
            </main>
        </div>
    );
}
