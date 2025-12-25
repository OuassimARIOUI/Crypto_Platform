"use client";

import { useEffect, useRef, useState } from "react";
import { auth } from "../../../lib/firebase";
import { applyActionCode, checkActionCode } from "firebase/auth";
import { useSearchParams } from "next/navigation";

export default function VerifyEmail() {
    const [status, setStatus] = useState("loading");
    const [details, setDetails] = useState("");
    const searchParams = useSearchParams();
    const ran = useRef(false);

    useEffect(() => {
        // React StrictMode (dev) can run effects twice; action codes are one-time.
        if (ran.current) return;
        ran.current = true;

        const oobCode =
            searchParams.get("oobCode") ||
            searchParams.get("oobcode") ||
            searchParams.get("oob_code") ||
            searchParams.get("code");
        if (!oobCode) {
            Promise.resolve().then(() => setStatus("invalid"));
            return;
        }

        (async () => {
            try {
                const info = await checkActionCode(auth, oobCode);
                if (info?.operation && info.operation !== "VERIFY_EMAIL") {
                    setStatus("invalid");
                    setDetails(`Action inattendue: ${info.operation}`);
                    return;
                }

                await applyActionCode(auth, oobCode);
                setStatus("success");
            } catch (e) {
                setStatus("error");
                const code = e?.code ? String(e.code) : "";
                const msg = e?.message ? String(e.message) : "";
                setDetails([code, msg].filter(Boolean).join(" — ") || "Lien expiré ou invalide.");
            }
        })();
    }, [searchParams]);

    return (
        <div className="text-white flex items-center justify-center min-h-screen">
            {status === "loading" && <p>Verifying your email...</p>}
            {status === "success" && (
                <p>Email verified! You can now log in.</p>
            )}
            {status === "error" && (
                <div className="text-center">
                    <p>Error verifying email. The link may be expired.</p>
                    {details ? <p className="mt-2 text-white/70 text-sm">{details}</p> : null}
                </div>
            )}
            {status === "invalid" && (
                <div className="text-center">
                    <p>Invalid verification link.</p>
                    {details ? <p className="mt-2 text-white/70 text-sm">{details}</p> : null}
                </div>
            )}
        </div>
    );
}
