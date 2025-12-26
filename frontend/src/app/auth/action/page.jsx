"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { checkActionCode } from "firebase/auth";
import { auth } from "../../../../lib/firebase";
import {
  buildRedirectUrl,
  getAuthActionBaseParams,
  getAuthActionInput,
  getFastRedirectPathname,
} from "../../../../lib/firebaseActionLink";

export default function AuthActionPage() {
  const sp = useSearchParams();
  const router = useRouter();

  const { mode, oobCode, continueUrl } = useMemo(() => getAuthActionInput(sp), [sp]);

  const [status, setStatus] = useState("loading");
  const [details, setDetails] = useState("");

  const baseParams = useMemo(
    () => getAuthActionBaseParams({ oobCode, continueUrl }),
    [oobCode, continueUrl]
  );

  useEffect(() => {
    if (!oobCode) {
      setStatus("invalid");
      setDetails("Paramètre oobCode manquant.");
      return;
    }

    // Fast path when Firebase provides the standard mode.
    const fastPath = getFastRedirectPathname(mode);
    if (fastPath) {
      router.replace(buildRedirectUrl(fastPath, baseParams));
      return;
    }

    // If mode is missing or incorrect (custom template mistakes), infer action from oobCode.
    (async () => {
      try {
        const info = await checkActionCode(auth, oobCode);

        if (info?.operation === "VERIFY_EMAIL") {
          router.replace(buildRedirectUrl("/verify-email", baseParams));
          return;
        }

        if (info?.operation === "PASSWORD_RESET") {
          router.replace(buildRedirectUrl("/reset-password", baseParams));
          return;
        }

        setStatus("unsupported");
        setDetails(info?.operation ? `Action: ${info.operation}` : "Action inconnue.");
      } catch (e) {
        setStatus("error");
        setDetails(e?.message || "Lien expiré ou invalide.");
      }
    })();
  }, [router, mode, oobCode, baseParams]);

  if (status === "loading") {
    return (
      <main className="min-h-screen w-full flex items-center justify-center bg-[#0A0E23] p-6">
        <div className="w-full max-w-xl text-center">
          <div className="text-white font-black leading-none text-[72px] sm:text-[96px]">…</div>
          <h1 className="mt-4 text-white text-2xl sm:text-3xl font-bold">Traitement du lien…</h1>
          <p className="mt-2 text-white/70">On vérifie l’action Firebase.</p>
        </div>
      </main>
    );
  }

  const title =
    status === "invalid"
      ? "Lien invalide"
      : status === "unsupported"
        ? "Action non supportée"
        : "Erreur";

  const subtitle =
    status === "invalid"
      ? "Impossible d’ouvrir ce lien."
      : status === "unsupported"
        ? "Cette action Firebase n’est pas gérée."
        : "Le lien est peut-être expiré.";

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#0A0E23] p-6">
      <div className="w-full max-w-xl text-center">
        <div className="text-white font-black leading-none text-[72px] sm:text-[96px]">400</div>
        <h1 className="mt-4 text-white text-2xl sm:text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-white/70">{subtitle}</p>
        {details ? <p className="mt-2 text-white/50 text-sm">{details}</p> : null}

        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg h-12 px-6 bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
          >
            Aller au login
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg h-12 px-6 bg-white/10 text-white font-bold hover:bg-white/15 transition-colors"
          >
            Revenir au dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
