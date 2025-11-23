import DashboardLayout from "@/components/dashboard/DashboardLayout";
import TradingChart from "@/components/trading/TradingChart";
import TradingBuy from "@/components/trading/TradingBuy";
import TradingSell from "@/components/trading/TradingSell";

export default function TradingPage() {
    return (
        <DashboardLayout>
            <div className="p-6 lg:p-10 space-y-10">
                <h1 className="text-4xl font-black text-white mb-6">Trading</h1>

                <TradingChart />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <TradingBuy />
                    <TradingSell />
                </div>
            </div>
        </DashboardLayout>
    );
}
