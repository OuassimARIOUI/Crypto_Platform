"use client";

import { useEffect, useState } from "react";
import { auth } from "../../../lib/firebase";
import { applyActionCode } from "firebase/auth";

export default function VerifyEmail() {
    const [status, setStatus] = useState("loading");

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const mode = params.get("mode");
        const oobCode = params.get("oobCode");

        if (mode !== "verifyEmail" || !oobCode) {
            Promise.resolve().then(() => setStatus("invalid"));
            return;
        }

        applyActionCode(auth, oobCode)
            .then(() => {
                setStatus("success");
            })
            .catch(() => {
                setStatus("error");
            });
    }, []);

    return (
        <div className="text-white flex items-center justify-center min-h-screen">
            {status === "loading" && <p>Verifying your email...</p>}
            {status === "success" && (
                <p>Email verified! You can now log in.</p>
            )}
            {status === "error" && (
                <p>Error verifying email. The link may be expired.</p>
            )}
            {status === "invalid" && (
                <p>Invalid verification link.</p>
            )}
        </div>
    );
}
