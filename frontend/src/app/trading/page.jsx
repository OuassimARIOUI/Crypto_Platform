import DashboardLayout from "@/components/dashboard/DashboardLayout";
import TradingBuyCard from "@/components/trading/TradingBuyCard";
import TradingSellCard from "@/components/trading/TradingSellCard";
import TradingHeaderChart from "@/components/trading/TradingHeaderChart";

export default function TradingPage() {
    return (
        <DashboardLayout>
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </span>
                            Trading
                        </h1>
                        <p className="text-gray-400 mt-2 ml-0 sm:ml-13">Buy and sell cryptocurrencies instantly at market price</p>
                    </div>
                    
                    {/* Live indicator */}
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-green-400 text-sm font-medium">Live Market</span>
                    </div>
                </div>

                {/* Chart Section */}
                <TradingHeaderChart />

                {/* Trading Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TradingBuyCard />
                    <TradingSellCard />
                </div>

                {/* Info Banner */}
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-white font-semibold mb-1">Trading Tips</h3>
                        <p className="text-gray-400 text-sm">
                            All trades are executed at current market prices. There are no trading fees on this platform. 
                            Make sure you have sufficient balance before placing a buy order.
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}