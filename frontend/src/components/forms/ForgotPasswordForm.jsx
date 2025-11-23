"use client";

import { useState } from "react";

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    async function handleReset(e) {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const res = await fetch("http://localhost:3001/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage("A reset link has been sent to your email.");
            } else {
                setMessage(data.error || "Error sending reset link.");
            }
        } catch (err) {
            setMessage("Server error. Try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="rounded-xl p-8 shadow-2xl glassmorphism-card bg-[#101c22]/50 border border-[#315668]/30">
            <div className="flex flex-col items-center text-center">
                <h1 className="text-white text-[32px] font-bold leading-tight pb-3 pt-2">
                    Reset Your Password
                </h1>

                <p className="text-[#A0A0A0] text-base leading-normal pb-8">
                    Enter your email address and we’ll send you a reset link.
                </p>

                <form onSubmit={handleReset} className="w-full space-y-6">
                    {/* Input */}
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
                  focus:border-primary h-14 pl-12 pr-4"
                            />
                        </div>
                    </label>

                    {/* Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full justify-center items-center rounded-lg h-12 bg-primary text-white font-bold hover:shadow-lg hover:shadow-primary/40"
                    >
                        {loading ? "Sending..." : "Send Reset Link"}
                    </button>
                </form>

                {/* Message */}
                {message && (
                    <p className="text-primary font-medium mt-4">{message}</p>
                )}

                {/* Back to login */}
                <p className="text-[#A0A0A0] text-sm mt-6">
                    Remembered your password?{" "}
                    <a href="/login" className="font-bold text-primary hover:underline">
                        Log In
                    </a>
                </p>
            </div>
        </div>
    );
}
