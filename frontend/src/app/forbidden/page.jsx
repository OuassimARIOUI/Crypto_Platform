import Link from "next/link";

export default function ForbiddenPage({ searchParams }) {
  const code = (searchParams?.code ?? "403").toString();

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#0A0E23] p-6">
      <div className="w-full max-w-xl text-center">
        <div className="text-white font-black leading-none text-[96px] sm:text-[140px]">
          {code}
        </div>

        <h1 className="mt-4 text-white text-2xl sm:text-3xl font-bold">Accès refusé</h1>
        <p className="mt-2 text-white/70">
          Vous n’êtes pas autorisé à accéder à cette page.
        </p>

        <div className="mt-8">
          <t>
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg h-12 px-6 bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
            >
              Revenir au dashboard
            </a>
          </t>
        </div>

        <div className="mt-4 text-sm text-white/50">Code: {code}</div>
      </div>
    </main>
  );
}
