"use client";
import { useState } from "react";

export default function CryptoRow({ crypto, index }) {
    const isPositive = crypto.change >= 0;
    const [imgError, setImgError] = useState(false);

    // Fallback: affiche les initiales du symbol si l'image ne charge pas
    const fallbackIcon = (
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/50 to-primary/20 flex items-center justify-center text-white font-bold text-xs">
            {crypto.symbol?.slice(0, 3).toUpperCase()}
        </div>
    );

    return (
        <tr className="border-t border-white/10 hover:bg-white/5 transition">
            <td className="px-4 py-3 text-gray-300">{index}</td>

            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    {imgError ? fallbackIcon : (
                        <img 
                            src={crypto.logo} 
                            className="h-8 w-8 rounded-full" 
                            alt={crypto.symbol}
                            onError={() => setImgError(true)}
                        />
                    )}
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
