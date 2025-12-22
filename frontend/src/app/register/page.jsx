"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Link from "next/link";

import { auth } from "../../../lib/firebase";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";

export default function RegisterPage() {
    const [pseudo, setPseudo] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [discordUsername, setDiscordUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    function validatePseudoLocal(value) {
        const v = (value ?? "").toString().trim();
        if (!v) return "Pseudo requis";
        if (!/^[A-Za-z0-9]+$/.test(v)) return "Pseudo invalide: uniquement lettres et chiffres";
        if (v.length < 6) return "Pseudo invalide: minimum 6 caractères";
        const letters = (v.match(/[A-Za-z]/g) || []).length;
        const digits = (v.match(/[0-9]/g) || []).length;
        if (letters < 3 || digits < 3) return "Pseudo invalide: minimum 3 lettres et 3 chiffres (ex: abc123)";
        return "";
    }

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");

        const localErr = validatePseudoLocal(pseudo);
        if (localErr) {
            setError(localErr);
            return;
        }

        setLoading(true);

        try {
            // 0️⃣ Vérifie disponibilité du pseudo AVANT Firebase
            const checkRes = await fetch(
                `http://localhost:3004/auth/pseudo/check?pseudo=${encodeURIComponent(pseudo.trim())}`
            );
            const checkData = await checkRes.json().catch(() => ({}));
            if (!checkRes.ok) {
                throw new Error(checkData?.error || "Pseudo invalide ou déjà utilisé");
            }

            // 1️⃣ Création du compte Firebase Auth
            const userCred = await createUserWithEmailAndPassword(auth, email, password);

            // 2️⃣ Envoi de l'email de vérification Firebase
            await sendEmailVerification(userCred.user);

            // 3️⃣ Sync avec ton backend (PostgreSQL)
            const syncRes = await fetch("http://localhost:3004/auth/firebase-sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firebaseUid: userCred.user.uid,
                    email,
                    pseudo,
                    discordUsername,
                }),
            });

            const syncData = await syncRes.json().catch(() => ({}));
            if (!syncRes.ok) {
                throw new Error(syncData?.error || "Sync error");
            }

            alert("Account created! Please verify your email before logging in.");
            window.location.href = "/login";

        } catch (err) {
            console.error(err);
            setError(err?.message || "Erreur lors de l'inscription");
        }

        setLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#101c22] p-4 relative">

            {/* Background blur effects */}
            <div className="absolute -top-1/4 -left-1/4 h-1/2 w-1/2 rounded-full bg-primary/20 blur-3xl animate-[spin_20s_linear_infinite]"></div>
            <div className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-primary/20 blur-3xl animate-[spin_25s_linear_infinite_reverse]"></div>

            <div className="relative z-10 max-w-md w-full rounded-xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-2xl">
                <h1 className="text-white text-[32px] font-bold text-center mb-8">
                    Create Your Account
                </h1>

                {error && (
                    <div className="mb-4 rounded-lg border border-red-500/30 bg-red-600/15 px-4 py-3 text-sm text-red-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-6">
                    <Input
                        label="Username"
                        placeholder="Enter your username"
                        value={pseudo}
                        onChange={(e) => setPseudo(e.target.value)}
                    />

                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <Input
                        label="Password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <Input
                        label="Discord Username (optional)"
                        placeholder="ex: mydiscord"
                        value={discordUsername}
                        onChange={(e) => setDiscordUsername(e.target.value)}
                    />

                    <Button type="submit" disabled={loading}>
                        {loading ? "Creating..." : "Create Account"}
                    </Button>
                </form>

                <p className="mt-4 text-center text-white/60 text-sm">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="font-medium text-primary/80 hover:text-primary transition-colors"
                    >
                        Log In
                    </Link>
                </p>
            </div>
        </div>
    );
}
