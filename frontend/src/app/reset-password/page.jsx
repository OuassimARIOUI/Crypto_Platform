"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Notification from "@/components/ui/Notification";

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const oobCode = searchParams.get("oobCode");

    const router = useRouter();

    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [redirectMessage, setRedirectMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (!oobCode) {
            setErrorMessage("Invalid or missing reset link (oobCode missing). Please request a new reset email.");
        }
    }, [oobCode]);

    async function handleSubmit(e) {
        e.preventDefault();

        if (!oobCode) return;
        if (!password || password.length < 6) {
            setErrorMessage("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");
        setRedirectMessage("");

        try {
            const res = await fetch("http://localhost:3004/auth/update-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ oobCode, newPassword: password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMessage(data?.error || "Server error.");
                return;
            }

            const email = data?.result?.email;
            setSuccessMessage(`Password updated${email ? ` for ${email}` : ""}.`);
            setRedirectMessage("Redirecting to login portal...");

            setTimeout(() => {
                router.push("/login");
            }, 2200);
        } catch {
            setErrorMessage("Server error.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col items-center justify-center bg-[#0A0E23] overflow-x-hidden p-4 sm:p-6 lg:p-8">

            {/* Background */}
            <div
                className="absolute inset-0 w-full h-full bg-center bg-cover opacity-30"
                style={{
                    backgroundImage:
                        `url("https://lh3.googleusercontent.com/aida-public/AB6AXuDyBroiDJnby3GMkVA97K-1ZymGAOfHWmi8SpM9cZfFR9FcFVHAUNMc-GHY7CfNQ4UR9rEb9niCqWbKJVqMNIYNnnjx1UAoiF_ZqlYkVnYErggEgh0P88EZj1Ab21-Dfo_LV4cyGKwCmULAepNknX_IiAAUw-mc0-aMEtbVSjOpf0ALsJgDAUHkTK1z4pPH9X3rdP_wHb_EdhjhCNzD2DVkXZvzYjSIwg4YLD92Yg4nAu7IL-wgkH-012A2B7j0EMTQmH9E7YbyJ17r")`,
                }}
            ></div>

            <div className="relative z-10 flex w-full flex-col items-center px-4">
                <div className="mb-8 flex items-center gap-3">
                    <span
                        className="material-symbols-outlined text-primary text-[200px] drop-shadow-[0_0_12px_rgba(13,166,242,0.6)] font-bold"
                    >
                        currency_bitcoin
                    </span>
                    <p className="text-3xl font-bold tracking-tight text-white">CryptoTrader</p>
                </div>

                <div
                    className="w-full max-w-md rounded-xl p-8 shadow-2xl glassmorphism-card border border-[#315668]/30"
                    style={{
                        background: "rgba(16,28,34,0.6)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                    }}
                >
                    <div className="space-y-3">
                        {successMessage && (
                            <Notification type="success" message={successMessage} />
                        )}
                        {redirectMessage && (
                            <Notification type="success" message={redirectMessage} />
                        )}
                        {errorMessage && (
                            <Notification
                                type="error"
                                message={errorMessage}
                                onClose={() => setErrorMessage("")}
                            />
                        )}
                    </div>

                    <div className="mt-6 flex flex-col items-center text-center">
                        <h1 className="text-white text-[32px] font-bold leading-tight pb-3 pt-2">
                            Choose a new password
                        </h1>
                        <p className="text-[#A0A0A0] text-base leading-normal pb-8 pt-1">
                            Enter a strong password to secure your account.
                        </p>

                        <form onSubmit={handleSubmit} className="w-full space-y-6">
                            <label className="w-full flex flex-col">
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#90b7cb] text-xl">
                                        lock
                                    </span>

                                    <input
                                        type="password"
                                        placeholder="New password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="form-input w-full rounded-lg text-white
                                            border border-[#315668] bg-[#101c22]/50
                                            focus:border-primary focus:outline-0
                                            h-14 pl-12 pr-4 placeholder:text-[#90b7cb]
                                            transition-shadow duration-300"
                                    />
                                </div>
                            </label>

                            <button
                                type="submit"
                                disabled={loading || !oobCode}
                                className="flex w-full justify-center items-center rounded-lg h-12 px-5 
                                    bg-primary text-white font-bold tracking-[0.015em]
                                    hover:shadow-lg hover:shadow-primary/40
                                    focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all
                                    disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? "Updating..." : "Update Password"}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-[#A0A0A0] text-sm">
                                Back to{" "}
                                <a href="/login" className="font-bold text-primary hover:underline">
                                    Log In
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-[#0A0E23]">
                <p className="text-white">Loading...</p>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
