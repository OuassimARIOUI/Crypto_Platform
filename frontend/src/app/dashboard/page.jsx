import DashboardLayout from "@/components/dashboard/DashboardLayout";
import TopCryptosTable from "@/components/dashboard/TopCryptosTable";
import DashboardStats from "@/components/dashboard/DashboardStats";

export default function DashboardPage() {
    return (
        <DashboardLayout>
            <div className="p-4 sm:p-6 lg:p-8 space-y-8">

                {/* Heading */}
                <h1 className="text-2xl sm:text-4xl font-black text-white">Dashboard</h1>

                {/* Stats (Mock for now → later backend) */}
                <DashboardStats />

                {/* Top 20 Cryptos */}
                <div className="mt-8">
                    <h2 className="text-[22px] font-bold text-white mb-4">
                        Top 20 Cryptocurrencies
                    </h2>

                    <TopCryptosTable />
                </div>
            </div>
        </DashboardLayout>
    );
}
