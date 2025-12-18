"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../lib/firebase";
import Link from "next/link";
import Cookies from "js-cookie";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1️⃣ LOGIN FIREBASE
            const userCred = await signInWithEmailAndPassword(auth, email, password);
            const token = await userCred.user.getIdToken();

            // 2️⃣ SYNC AVEC TON BACKEND
            const res = await fetch("http://localhost:3004/auth/firebase-login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token }),
            });

            const data = await res.json();
            console.log("Firebase login backend response:", data);

            if (!res.ok) {
                alert(data.error || "Login failed.");
                setLoading(false);
                return;
            }

            // 3️⃣ STOCK TOKEN ET REDIRECT
            Cookies.set("token", token, { expires: 7 });
            window.location.href = "/dashboard";
        } catch (err) {
            console.error("LOGIN ERROR:", err);
            alert(err.message || "Erreur serveur");
        }

        setLoading(false);
    };

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

            {/* CARD */}
            <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-md">

                <div className="flex items-center gap-3 mb-4">
                    <span className="material-symbols-outlined text-primary text-4xl">
                        currency_bitcoin
                    </span>
                    <span className="text-white text-3xl font-bold tracking-tight font-display">
                        CryptoTrade
                    </span>
                </div>

                <div className="glassmorphism flex w-full flex-col gap-6 rounded-xl p-8">

                    <h2 className="text-white text-4xl font-black leading-tight tracking-tight">
                        Welcome Back
                    </h2>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                        {/* EMAIL */}
                        <label className="flex flex-col">
                            <p className="text-[#EAEAEA] text-base font-medium pb-2">Email</p>
                            <input
                                type="email"
                                className="form-input w-full rounded-lg border border-white/20 bg-white/10 h-14 p-[15px] text-[#EAEAEA] placeholder:text-[#888888]"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </label>

                        {/* PASSWORD */}
                        <label className="flex flex-col">
                            <p className="text-[#EAEAEA] text-base font-medium pb-2">Password</p>
                            <input
                                type="password"
                                className="form-input w-full rounded-lg border border-white/20 bg-white/10 h-14 p-[15px] text-[#EAEAEA] placeholder:text-[#888888]"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </label>

                        {/* LINK */}
                        <Link
                            href="/forgot-password"
                            className="text-primary underline text-sm hover:text-primary/80 transition-colors"
                        >
                            Forgot Password?
                        </Link>

                        {/* BUTTON */}
                        <button
                            type="submit"
                            className="w-full h-14 rounded-lg bg-primary text-white text-base font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all duration-300"
                        >
                            {loading ? "Logging in..." : "Login"}
                        </button>

                        {/* REGISTER */}
                        <p className="text-center text-[#888888] text-sm">
                            Need an account?{" "}
                            <Link href="/register" className="text-primary font-bold underline hover:text-primary/80">
                                Register here
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
