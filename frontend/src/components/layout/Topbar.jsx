import React from 'react';

export default function Topbar() {
    return (
        <header className="flex items-center justify-end w-full h-16 px-6 border-b border-white/10 bg-[#101c22]/80 backdrop-blur-md">
            <div className="flex items-center gap-4 text-white">
                <button className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined">notifications</span>
                </button>
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 bg-cover rounded-full"
                        style={{
                            backgroundImage:
                                `url("https://lh3.googleusercontent.com/aida-public/AB6AXuB10TwVa0BT0lDRKcvnLrWBIlTnMp-Y-n6a26rmrGUSY2QXMFe-xsRgi3JnoC3IAiqr62TnT3U4U1EJ1vrWvoinYYVnAdpLqypbLPIdGuMXnVua9ap-VUklkwrilBMshbf3LXnS6FNsgkitlHWoNo6Ay1qMIbftNxCvTvMCdfKDkEHjr7hNiyYkCOBZ5gbKwrT5dtP2KLMrLtQIJB_2xeC_xLfIexPG9kKgSUNmCa7X3GwmwGk0dvxFhSqlBvo9I-6JU96IrT9HQfHn")`
                        }}
                    />
                    <div>
                        <p className="text-sm font-medium">User</p>
                        <p className="text-xs text-white/50">user@email.com</p>
                    </div>
                </div>
            </div>
        </header>
    );
}
