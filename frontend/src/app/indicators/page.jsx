import React from 'react';
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import IndicatorsPanel from "@/components/indicators/IndicatorsPanel";

export default function IndicatorsPage() {
    return (
        <DashboardLayout>
            <div className="p-4 sm:p-6 lg:p-10 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/20 border border-purple-500/20 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-black text-white">Technical Indicators</h1>
                            <p className="text-white/60 text-sm mt-1">Analyze market trends with advanced overlays</p>
                        </div>
                    </div>
                    
                    {/* Feature badges */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FF00FF]/10 border border-[#FF00FF]/20">
                            <div className="w-2 h-0.5 bg-[#FF00FF] rounded-full" />
                            <span className="text-[#FF00FF] text-xs font-medium">SMA 7</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FFFF00]/10 border border-[#FFFF00]/20">
                            <div className="w-2 h-0.5 bg-[#FFFF00] rounded-full" />
                            <span className="text-[#FFFF00] text-xs font-medium">SMA 30</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                            <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span className="text-primary text-xs font-medium">Alerts</span>
                        </div>
                    </div>
                </div>

                {/* Main Panel */}
                <IndicatorsPanel />

                {/* Info Banner */}
                <div className="rounded-xl bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 p-4 flex items-start gap-3">
                    <svg className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <div>
                        <p className="text-white/90 text-sm font-medium">Pro Tips</p>
                        <p className="text-white/60 text-sm mt-1">
                            When SMA7 crosses above SMA30, it may signal a bullish trend. Set up Discord alerts to get notified of significant price movements.
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}