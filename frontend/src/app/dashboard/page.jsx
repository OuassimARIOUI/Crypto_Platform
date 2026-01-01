import DashboardLayout from "@/components/dashboard/DashboardLayout";
import TopCryptosTable from "@/components/dashboard/TopCryptosTable";
import DashboardStats from "@/components/dashboard/DashboardStats";

export default function DashboardPage() {
    return (
        <DashboardLayout>
            <div className="p-4 sm:p-6 lg:p-8 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/20">
                            <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-black text-white">Dashboard</h1>
                            <p className="text-white/60 text-sm mt-1">Your crypto market overview</p>
                        </div>
                    </div>
                    
                    {/* Live indicator */}
                    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                        <div className="relative flex items-center justify-center">
                            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                            <div className="absolute w-2.5 h-2.5 bg-green-500 rounded-full animate-ping opacity-75" />
                        </div>
                        <span className="text-white/80 text-sm font-medium">Live Market Data</span>
                    </div>
                </div>

                {/* Stats Cards */}
                <DashboardStats />

                {/* Top 20 Cryptos Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-yellow-500/30 to-orange-500/20 border border-yellow-500/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Top 20 Cryptocurrencies</h2>
                                <p className="text-white/50 text-sm">Ranked by market performance</p>
                            </div>
                        </div>
                    </div>

                    <TopCryptosTable />
                </div>

                {/* Info Banner */}
                <div className="rounded-xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 p-4 flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <p className="text-white/90 text-sm font-medium">Market Insights</p>
                        <p className="text-white/60 text-sm mt-1">Prices are updated in real-time. Click on any cryptocurrency to view detailed charts and indicators.</p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
