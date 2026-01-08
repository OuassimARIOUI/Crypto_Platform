"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function CryptoRow({ crypto, index }) {
    const change = Number(crypto.change) || 0;
    const isPositive = change >= 0;
    const [imgError, setImgError] = useState(false);

    // Rank badge colors based on position
    const getRankStyle = () => {
        if (index === 1) return "bg-gradient-to-br from-yellow-500/30 to-yellow-600/20 text-yellow-400 border-yellow-500/30";
        if (index === 2) return "bg-gradient-to-br from-gray-300/30 to-gray-400/20 text-gray-300 border-gray-400/30";
        if (index === 3) return "bg-gradient-to-br from-orange-600/30 to-orange-700/20 text-orange-400 border-orange-600/30";
        return "bg-white/5 text-white/60 border-white/10";
    };

    // Fallback: affiche les initiales du symbol si l'image ne charge pas
    const fallbackIcon = (
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/50 to-primary/20 flex items-center justify-center text-white font-bold text-xs border border-primary/20">
            {crypto.symbol?.slice(0, 3).toUpperCase()}
        </div>
    );

    return (
        <>
            {/* Desktop Row */}
            <div className="hidden sm:grid sm:grid-cols-[60px_1fr_140px_120px_100px] gap-4 px-4 py-4 items-center hover:bg-white/5 transition-all duration-200 group">
                {/* Rank */}
                <div className="flex justify-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold border ${getRankStyle()}`}>
                        {index}
                    </span>
                </div>

                {/* Name & Symbol */}
                <div className="flex items-center gap-3">
                    {imgError ? fallbackIcon : (
                        <div className="relative">
                            <img 
                                src={crypto.logo} 
                                className="h-10 w-10 rounded-full border border-white/10" 
                                alt={crypto.symbol}
                                onError={() => setImgError(true)}
                            />
                            {/* Small indicator dot */}
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black ${isPositive ? 'bg-green-500' : 'bg-red-500'}`} />
                        </div>
                    )}
                    <div>
                        <p className="text-white font-semibold group-hover:text-primary transition-colors">{crypto.name}</p>
                        <p className="text-white/50 text-xs font-medium">{crypto.symbol.toUpperCase()}</p>
                    </div>
                </div>

                {/* Price */}
                <div className="text-right">
                    <p className="text-white font-semibold tabular-nums">
                        ${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>

                {/* 24h Change */}
                <div className="text-right">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-semibold ${
                        isPositive 
                            ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}>
                        {isPositive ? (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        ) : (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        )}
                        {isPositive && "+"}{change.toFixed(2)}%
                    </span>
                </div>

                {/* Action */}
                <div className="text-right">
                    <Link 
                        href={`/trading?symbol=${crypto.symbol.toLowerCase()}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium border border-primary/20 hover:bg-primary/20 transition-colors opacity-0 group-hover:opacity-100"
                    >
                        Trade
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>
            </div>

            {/* Mobile Row */}
            <div className="sm:hidden px-4 py-4 hover:bg-white/5 transition-all duration-200">
                <div className="flex items-center gap-3">
                    {/* Rank Badge */}
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold border shrink-0 ${getRankStyle()}`}>
                        {index}
                    </span>

                    {/* Logo */}
                    {imgError ? (
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/50 to-primary/20 flex items-center justify-center text-white font-bold text-xs border border-primary/20 shrink-0">
                            {crypto.symbol?.slice(0, 3).toUpperCase()}
                        </div>
                    ) : (
                        <img 
                            src={crypto.logo} 
                            className="h-9 w-9 rounded-full border border-white/10 shrink-0" 
                            alt={crypto.symbol}
                            onError={() => setImgError(true)}
                        />
                    )}

                    {/* Name & Symbol */}
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold truncate">{crypto.name}</p>
                        <p className="text-white/50 text-xs font-medium">{crypto.symbol.toUpperCase()}</p>
                    </div>

                    {/* Price & Change */}
                    <div className="text-right shrink-0">
                        <p className="text-white font-semibold text-sm tabular-nums">
                            ${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                            isPositive ? "text-green-400" : "text-red-400"
                        }`}>
                            {isPositive ? "▲" : "▼"}
                            {isPositive && "+"}{change.toFixed(2)}%
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
}
