import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PortfolioStats from "@/components/portfolio/PortfolioStats";
import PortfolioAssets from "@/components/portfolio/PortfolioAssets";
import PortfolioTransactions from "@/components/portfolio/PortfolioTransactions";
import TransferFunds from "@/components/portfolio/TransferFunds";

export default function PortfolioPage() {
    return (
        <DashboardLayout>
            <div className="p-4 sm:p-6 lg:p-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">Portfolio</h1>
                        <p className="text-gray-400 mt-1">Track your crypto investments and manage your assets</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <PortfolioStats />

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Assets Section - Takes 2 columns on xl */}
                    <div className="xl:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                My Assets
                            </h2>
                        </div>
                        <PortfolioAssets />
                    </div>

                    {/* Sidebar - Transactions on xl */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                Recent Activity
                            </h2>
                        </div>
                        <PortfolioTransactions />
                    </div>
                </div>

                {/* Transfer Section */}
                <div className="pt-2">
                    <TransferFunds />
                </div>
            </div>
        </DashboardLayout>
    );
}