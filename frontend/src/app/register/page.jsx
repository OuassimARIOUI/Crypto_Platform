"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useNotification } from "@/hooks/useNotification";
import Notification from "@/components/ui/Notification";

import { auth, isFirebaseConfigured } from "../../../lib/firebase";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";

export default function RegisterPage() {
    const [pseudo, setPseudo] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [discordUsername, setDiscordUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { notification, showNotification, hideNotification } = useNotification();

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
            //  Vérifie disponibilité du pseudo AVANT Firebase
            const checkRes = await fetch(
                `http://localhost:3004/auth/pseudo/check?pseudo=${encodeURIComponent(pseudo.trim())}`
            );
            const checkData = await checkRes.json().catch(() => ({}));
            if (!checkRes.ok) {
                throw new Error(checkData?.error || "Pseudo invalide ou déjà utilisé");
            }

            //  Création du compte Firebase Auth
            const userCred = await createUserWithEmailAndPassword(auth, email, password);

            //  Envoi de l'email de vérification Firebase
            await sendEmailVerification(userCred.user);

            //  Sync avec le backend (PostgreSQL)
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

            showNotification("Compte créé ! Veuillez vérifier votre email avant de vous connecter.", "success", 7000);
            setTimeout(() => {
                window.location.href = "/login";
            }, 2000);

        } catch (err) {
            console.error(err);
            setError(err?.message || "Erreur lors de l'inscription");
        }

        setLoading(false);
    };

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col items-center justify-center bg-[#0A0E23] overflow-x-hidden p-4 sm:p-6 lg:p-8">

            {/* Notification */}
            {notification && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    onClose={hideNotification}
                />
            )}

            {/* Background GIF */}
            <div
                className="absolute inset-0 w-full h-full bg-center bg-cover opacity-40"
                style={{
                    backgroundImage: `url("/bg.gif")`,
                }}
            ></div>
            {/* Overlay gradient for better readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0A0E23]/70 via-[#0A0E23]/50 to-[#0A0E23]/80"></div>

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
                    <h1 className="text-white text-4xl font-black leading-tight tracking-tight">
                        Create Your Account
                    </h1>

                    {error && (
                        <div className="rounded-lg border border-red-500/30 bg-red-600/15 px-4 py-3 text-sm text-red-200">
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

                    <p className="text-center text-[#888888] text-sm">
                        Already have an account?{" "}
                        <Link href="/login" className="text-primary font-bold underline hover:text-primary/80">
                            Log In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
