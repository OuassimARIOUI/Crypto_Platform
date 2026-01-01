"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";

function DiscordCallbackContent() {
    const router = useRouter();
    const params = useSearchParams();
    const [status, setStatus] = useState("loading");
    const [error, setError] = useState("");

    useEffect(() => {
        async function run() {
            const code = params.get("code");
            if (!code) {
                setStatus("error");
                setError("Missing code from Discord callback.");
                return;
            }

            const token = Cookies.get("token");
            if (!token) {
                setStatus("error");
                setError("You must be logged in to link Discord.");
                return;
            }

            try {
                const res = await fetch("http://localhost:3004/discord/exchange", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + token,
                    },
                    body: JSON.stringify({ code }),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data?.error || "Discord link failed");

                setStatus("success");
                setTimeout(() => router.replace("/profile"), 700);
            } catch (e) {
                setStatus("error");
                setError(e.message || "Discord link failed");
            }
        }

        run();
    }, [params, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0A0E23] p-6">
            <div className="glassmorphism max-w-md w-full p-6 rounded-xl">
                {status === "loading" && (
                    <p className="text-white">Linking Discord…</p>
                )}
                {status === "success" && (
                    <p className="text-white">Discord linked. Redirecting…</p>
                )}
                {status === "error" && (
                    <div className="space-y-2">
                        <p className="text-white">Discord link failed.</p>
                        <p className="text-white/60 text-sm">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function DiscordCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#0A0E23] p-6">
                <div className="glassmorphism max-w-md w-full p-6 rounded-xl">
                    <p className="text-white">Loading...</p>
                </div>
            </div>
        }>
            <DiscordCallbackContent />
        </Suspense>
    );
}
