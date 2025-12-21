import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
    return (
        <main className="w-full">
            {/* HERO */}
            <section
                className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden"
                style={{
                    backgroundImage:
                        'url("https://www.shutterstock.com/image-illustration/cryptocurrency-world-future-financial-currency-600nw-2157495541.jpg")',
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            >
                {/* overlay */}
                <div className="absolute inset-0 bg-[#101c22]/80 backdrop-blur-sm"></div>

                <div className="relative z-10 w-full max-w-6xl px-4">
                    <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-2">
                        {/* Left: copy */}
                        <div className="text-center lg:text-left">
                            <div className="mb-6 inline-flex items-center gap-3">
                                <span
                                    className="material-symbols-outlined text-primary text-[64px] drop-shadow-[0_0_12px_rgba(13,166,242,0.6)] font-bold"
                                >
                                    currency_bitcoin
                                </span>
                                <h1 className="text-3xl font-bold tracking-tight text-white">CryptoTrader</h1>
                            </div>

                            <h2 className="text-white text-[42px] leading-tight font-black">
                                Track. Analyze. Trade smarter.
                            </h2>

                            <p className="mt-4 text-[#A0A0A0] text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
                                Un dashboard crypto complet : prix en temps réel, indicateurs (SM7 / SM30), alertes,
                                et un portefeuille virtuel pour suivre vos performances.
                            </p>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
                                <Link
                                    href="/register"
                                    className="flex justify-center items-center rounded-lg h-12 px-6 
                                        bg-primary text-white font-bold tracking-[0.015em]
                                        hover:shadow-lg hover:shadow-primary/40
                                        focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all"
                                >
                                    Get Started
                                </Link>

                                <div className="text-sm text-[#A0A0A0]">
                                    Vous avez un compte ?{" "}
                                    <Link
                                        href="/login"
                                        className="font-bold text-primary hover:underline"
                                    >
                                        Connectez-vous
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Right: preview */}
                        <div className="flex justify-center lg:justify-end">
                            <div
                                className="w-full max-w-xl rounded-2xl border border-[#315668]/30 shadow-2xl"
                                style={{
                                    background: "rgba(16,28,34,0.55)",
                                    backdropFilter: "blur(18px)",
                                    WebkitBackdropFilter: "blur(18px)",
                                }}
                            >
                                <div className="p-4">
                                    <Image
                                        src="/hero-trading.svg"
                                        alt="Aperçu du dashboard de trading"
                                        width={980}
                                        height={720}
                                        priority
                                        className="w-full h-auto rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* EXPLANATION */}
            <section className="w-full bg-[#0A0E23]">
                <div className="mx-auto w-full max-w-6xl px-4 py-16">
                    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
                        <div>
                            <h3 className="text-white text-3xl font-extrabold">Ce que fait notre application</h3>
                            <p className="mt-4 text-[#A0A0A0] leading-relaxed">
                                CryptoTrader collecte et affiche les données du marché, puis vous aide à analyser les tendances
                                avec des indicateurs simples et utiles. L’objectif : prendre de meilleures décisions, plus vite,
                                et suivre vos résultats dans un portefeuille virtuel.
                            </p>

                            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div
                                    className="rounded-xl border border-[#315668]/30 p-5"
                                    style={{
                                        background: "rgba(16,28,34,0.55)",
                                        backdropFilter: "blur(18px)",
                                        WebkitBackdropFilter: "blur(18px)",
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary">query_stats</span>
                                        <p className="text-white font-bold">Marché</p>
                                    </div>
                                    <p className="mt-2 text-sm text-[#A0A0A0]">Prix, variations et historique.</p>
                                </div>

                                <div
                                    className="rounded-xl border border-[#315668]/30 p-5"
                                    style={{
                                        background: "rgba(16,28,34,0.55)",
                                        backdropFilter: "blur(18px)",
                                        WebkitBackdropFilter: "blur(18px)",
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary">monitoring</span>
                                        <p className="text-white font-bold">Indicateurs</p>
                                    </div>
                                    <p className="mt-2 text-sm text-[#A0A0A0]">SM7 &amp; SM30 pour lisser le bruit.</p>
                                </div>

                                <div
                                    className="rounded-xl border border-[#315668]/30 p-5"
                                    style={{
                                        background: "rgba(16,28,34,0.55)",
                                        backdropFilter: "blur(18px)",
                                        WebkitBackdropFilter: "blur(18px)",
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
                                        <p className="text-white font-bold">Portefeuille</p>
                                    </div>
                                    <p className="mt-2 text-sm text-[#A0A0A0]">Simulation, suivi et performance.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center lg:justify-end">
                            <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#315668]/30 shadow-2xl">
                                <div className="relative aspect-[16/10]">
                                    <Image
                                        src="https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&w=1600&q=80"
                                        alt="Analyse de marché sur un écran"
                                        fill
                                        sizes="(min-width: 1024px) 640px, 100vw"
                                        className="object-cover"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SM7 / SM30 */}
            <section className="w-full bg-[#0A0E23]">
                <div className="mx-auto w-full max-w-6xl px-4 pb-16">
                    <div
                        className="rounded-2xl border border-[#315668]/30 p-8"
                        style={{
                            background: "rgba(16,28,34,0.55)",
                            backdropFilter: "blur(18px)",
                            WebkitBackdropFilter: "blur(18px)",
                        }}
                    >
                        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
                            <div>
                                <h3 className="text-white text-3xl font-extrabold">SM7 &amp; SM30 : c’est quoi ?</h3>
                                <p className="mt-4 text-[#A0A0A0] leading-relaxed">
                                    SM7 et SM30 sont des moyennes mobiles simples (SMA) calculées sur 7 et 30 périodes
                                    (souvent 7/30 jours). Elles lissent les prix pour mieux visualiser la tendance.
                                </p>

                                <div className="mt-6 grid grid-cols-1 gap-4">
                                    <div className="rounded-xl border border-[#315668]/30 p-5 bg-white/5">
                                        <p className="text-white font-bold">SM7 (court terme)</p>
                                        <p className="mt-1 text-sm text-[#A0A0A0]">
                                            Plus réactive : utile pour voir les impulsions récentes et les retournements rapides.
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-[#315668]/30 p-5 bg-white/5">
                                        <p className="text-white font-bold">SM30 (moyen terme)</p>
                                        <p className="mt-1 text-sm text-[#A0A0A0]">
                                            Plus stable : donne une lecture plus « propre » de la tendance générale.
                                        </p>
                                    </div>
                                </div>

                                <p className="mt-6 text-sm text-[#A0A0A0]">
                                    Exemple courant : quand la SM7 passe au-dessus de la SM30, cela peut indiquer un momentum haussier.
                                    L’inverse peut indiquer un affaiblissement. (Ce n’est pas un conseil financier.)
                                </p>
                            </div>

                            <div className="flex justify-center lg:justify-end">
                                <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#315668]/30">
                                    <div className="relative aspect-[16/10]">
                                        <Image
                                            src="https://images.unsplash.com/photo-1642427749670-f20e2e76ed8c?auto=format&fit=crop&w=1600&q=80"
                                            alt="Graphiques et indicateurs sur un écran"
                                            fill
                                            sizes="(min-width: 1024px) 640px, 100vw"
                                            className="object-cover"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Link
                            href="/register"
                            className="flex justify-center items-center rounded-lg h-12 px-6 
                                bg-primary text-white font-bold tracking-[0.015em]
                                hover:shadow-lg hover:shadow-primary/40
                                focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all"
                        >
                            Créer un compte
                        </Link>
                        <Link
                            href="/login"
                            className="flex justify-center items-center rounded-lg h-12 px-6 
                                border border-[#315668]/40 text-white font-bold tracking-[0.015em]
                                hover:bg-white/5
                                focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all"
                        >
                            Se connecter
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
