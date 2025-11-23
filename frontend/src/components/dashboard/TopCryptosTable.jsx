import CryptoRow from "./CryptoRow";

export default function TopCryptosTable() {
    const mock = [
        {
            id: 1,
            name: "Bitcoin",
            symbol: "BTC",
            price: 68244,
            change: 2.15,
            sparkline: "https://www.coingecko.com/coins/1/sparkline.svg",
            logo: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
        },
    ];

    return (
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-lg overflow-hidden">
            <table className="w-full">
                <thead>
                <tr className="border-b border-white/10 text-gray-400 text-xs uppercase">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">24h %</th>
                    <th className="px-4 py-3">Last 7 Days</th>
                </tr>
                </thead>

                <tbody>
                {mock.map((c) => (
                    <CryptoRow key={c.id} crypto={c} />
                ))}
                </tbody>
            </table>
        </div>
    );
}
