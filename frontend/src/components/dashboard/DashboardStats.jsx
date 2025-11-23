export default function DashboardStats() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl p-6 border border-white/10 bg-white/5">
                <p className="text-gray-300 text-base">Total Portfolio Value</p>
                <p className="text-4xl font-bold">$12,500.00</p>
                <p className="text-green-400 font-medium">+ $350 (2.8%)</p>
            </div>

            <div className="rounded-xl p-6 border border-white/10 bg-white/5">
                <p className="text-gray-300">Today's Profit</p>
                <p className="text-4xl font-bold">$220.00</p>
                <p className="text-green-400">+ 8.4%</p>
            </div>

            <div className="rounded-xl p-6 border border-white/10 bg-white/5">
                <p className="text-gray-300">Total Profit</p>
                <p className="text-4xl font-bold">$4,920.50</p>
                <p className="text-green-400">+ 41.2%</p>
            </div>
        </div>
    );
}
