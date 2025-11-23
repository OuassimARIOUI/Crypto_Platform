export default function PortfolioStats() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2 rounded-xl p-6 border border-white/10 bg-white/5">
                <p className="text-gray-300 text-base font-medium">Total Portfolio Value</p>
                <p className="text-white text-4xl font-bold">$39,125.67</p>
                <p className="text-green-400 text-base font-medium">+ $567.89 (+4.8%)</p>
            </div>

            <div className="flex flex-col gap-2 rounded-xl p-6 border border-white/10 bg-white/5">
                <p className="text-gray-300 text-base font-medium">Today's Profit</p>
                <p className="text-white text-4xl font-bold">$1,234.12</p>
                <p className="text-green-400 text-base font-medium">+12.1%</p>
            </div>

            <div className="flex flex-col gap-2 rounded-xl p-6 border border-white/10 bg-white/5">
                <p className="text-gray-300 text-base font-medium">Total Profit</p>
                <p className="text-white text-4xl font-bold">$8,750.40</p>
                <p className="text-green-400 text-base font-medium">+35.2%</p>
            </div>
        </div>
    );
}
