import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PortfolioStats from "@/components/portfolio/PortfolioStats";
import PortfolioAssets from "@/components/portfolio/PortfolioAssets";
import PortfolioTransactions from "@/components/portfolio/PortfolioTransactions";

export default function PortfolioPage() {
    return (
        <DashboardLayout>
            <div className="p-6 lg:p-8 space-y-10">
                <h1 className="text-4xl font-black text-white">Portfolio</h1>

                <PortfolioStats />

                <div>
                    <h2 className="text-[22px] font-bold text-white mb-4">My Assets</h2>
                    <PortfolioAssets />
                </div>

                <div>
                    <h2 className="text-[22px] font-bold text-white mb-4">Recent Transactions</h2>
                    <PortfolioTransactions />
                </div>
            </div>
        </DashboardLayout>
    );
}