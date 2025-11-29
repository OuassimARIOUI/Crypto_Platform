import DashboardLayout from "@/components/dashboard/DashboardLayout";
import TradingBuyCard from "@/components/trading/TradingBuyCard";
import TradingSellCard from "@/components/trading/TradingSellCard";
export default function TradingPage() {
    return (
        <DashboardLayout>
            <div className="p-6 lg:p-10 space-y-10">
                <h1 className="text-4xl font-black text-white mb-6">Trading</h1>

                <p className="text-white">Trading chart coming soon...</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <TradingBuyCard />
                    <TradingSellCard />
                </div>
            </div>
        </DashboardLayout>
    );
}