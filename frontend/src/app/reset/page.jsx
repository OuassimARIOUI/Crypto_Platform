"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const oobCode = searchParams.get("oobCode");

    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();

        const res = await fetch("http://localhost:3004/auth/update-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ oobCode, newPassword: password })
        });

        const data = await res.json();
        setMessage(res.ok ? "Password updated!" : data.error);
    }

    return (
        <div className="flex h-screen items-center justify-center">
            <form onSubmit={handleSubmit} className="bg-gray-900 p-8 rounded-xl text-white">
                <h1 className="text-2xl font-bold mb-4">Choose a new password</h1>

                <input
                    type="password"
                    className="border p-2 text-black w-full mb-4"
                    placeholder="New password"
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button className="bg-blue-500 w-full p-2 rounded">
                    Update Password
                </button>

                {message && <p className="mt-4">{message}</p>}
            </form>
        </div>
    );
}
