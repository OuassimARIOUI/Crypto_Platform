"use client";

import React, { useState } from "react";
import Notification from "@/components/ui/Notification";

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [notice, setNotice] = useState(null);

    async function handleReset(e) {
        e.preventDefault();
        setLoading(true);
        setNotice(null);

        try {
            const res = await fetch("http://localhost:3004/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            if (res.ok) {
                setNotice({ type: "success", message: "A reset link has been sent to your email." });
            } else {
                setNotice({ type: "error", message: data?.error || "Server error." });
            }
        } catch {
            setNotice({ type: "error", message: "Server error." });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full max-w-md rounded-xl p-8 shadow-2xl glassmorphism-card border border-[#315668]/30"
             style={{
                 background: "rgba(16,28,34,0.6)",
                 backdropFilter: "blur(20px)",
                 WebkitBackdropFilter: "blur(20px)",
             }}
        >
            <div className="flex flex-col items-center text-center">
                {notice?.message && (
                    <div className="w-full mb-4">
                        <Notification
                            type={notice.type}
                            message={notice.message}
                            onClose={() => setNotice(null)}
                        />
                    </div>
                )}
                <h1 className="text-white text-[32px] font-bold leading-tight pb-3 pt-2">
                    Reset Your Password
                </h1>

                <p className="text-[#A0A0A0] text-base leading-normal pb-8 pt-1">
                    No problem. Just enter the email address you used to sign up, and we&apos;ll send you a link to reset your password.
                </p>

                <form onSubmit={handleReset} className="w-full space-y-6">

                    {/* EMAIL INPUT */}
                    <label className="w-full flex flex-col">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#90b7cb] text-xl">
                                mail
                            </span>

                            <input
                                type="email"
                                placeholder="Enter your email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="form-input w-full rounded-lg text-white
                                    border border-[#315668] bg-[#101c22]/50
                                    focus:border-primary focus:outline-0
                                    h-14 pl-12 pr-4 placeholder:text-[#90b7cb]
                                    transition-shadow duration-300"
                            />
                        </div>
                    </label>

                    {/* BOUTON */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full justify-center items-center rounded-lg h-12 px-5 
                        bg-primary text-white font-bold tracking-[0.015em]
                        hover:shadow-lg hover:shadow-primary/40
                        focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all"
                    >
                        {loading ? "Sending..." : "Send Reset Link"}
                    </button>
                </form>

            </div>
        </div>
    );
}
