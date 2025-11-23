"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Link from "next/link";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch("http://localhost:3001/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            console.log("Login response:", data);

            if (!res.ok) {
                alert(data.error || "Login failed");
                return;
            }

            // Save token in localStorage
            localStorage.setItem("token", data.token);

            window.location.href = "/dashboard";
        } catch (err) {
            console.error(err);
            alert("Erreur serveur");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0A0E23] p-4 relative">

            {/* Background */}
            <div
                className="absolute inset-0 bg-cover bg-center opacity-30"
                style={{
                    backgroundImage:
                        `url("https://lh3.googleusercontent.com/aida-public/AB6AXuDyBroiDJnby3GMkVA97K-1ZymGAOfHWmi8SpM9cZfFR9FcFVHAUNMc-GHY7CfNQ4UR9rEb9niCqWbKJVqMNIYNnnjx1UAoiF_ZqlYkVnYErggEgh0P88EZj1Ab21-Dfo_LV4cyGKwCmULAepNknX_IiAAUw-mc0-aMEtbVSjOpf0ALsJgDAUHkTK1z4pPH9X3rdP_wHb_EdhjhCNzD2DVkXZvzYjSIwg4YLD92Yg4nAu7IL-wgkH-012A2B7j0EMTQmH9E7YbyJ17r")`,
                }}
            />

            <div className="relative z-10 max-w-md w-full glassmorphism p-8 rounded-xl">
                {/* Logo */}
                <div className="flex justify-center items-center gap-3 mb-8">
          <span className="material-symbols-outlined text-primary text-4xl">
            currency_bitcoin
          </span>
                    <h1 className="text-white text-3xl font-bold">CryptoTrade</h1>
                </div>

                <h2 className="text-white text-4xl font-black mb-6">Welcome Back</h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <Input
                        label="Email"
                        type="email"
                        placeholder="Enter your email"
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

                    <Link href="/forgot-password" className="text-primary underline text-sm">
                        Forgot Password?
                    </Link>

                    <Button type="submit">Login</Button>

                    <p className="text-center text-white/60 text-sm">
                        Need an account?{" "}
                        <Link href="/register" className="text-primary font-bold underline">
                            Register here
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
