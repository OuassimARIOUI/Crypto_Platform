export default function CryptoRow({ crypto }) {
    const isPositive = crypto.change >= 0;

    return (
        <tr className="border-t border-white/10 hover:bg-white/5 transition">
            <td className="px-4 py-3 text-gray-300">{crypto.id}</td>

            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <img src={crypto.logo} className="h-8 w-8" alt="" />
                    <div>
                        <p className="text-white font-semibold">{crypto.name}</p>
                        <p className="text-gray-400 text-xs">{crypto.symbol}</p>
                    </div>
                </div>
            </td>

            <td className="px-4 py-3 text-white font-medium">
                ${crypto.price.toLocaleString()}
            </td>

            <td className="px-4 py-3">
        <span
            className={`font-semibold ${
                isPositive ? "text-green-400" : "text-red-400"
            }`}
        >
          {isPositive && "+"}
            {crypto.change}%
        </span>
            </td>


        </tr>
    );
}
