"use client";
import { useEffect, useState } from "react";

export default function ProfileDetails() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        try {
            const raw = localStorage.getItem("user");
            if (raw) {
                const u = JSON.parse(raw);
                delete u.password; // on n’affiche pas ça
                setUser(u);
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    if (!user) {
        return <p className="text-white">Aucun utilisateur en session.</p>;
    }

    return (
        <div className="glassmorphism rounded-xl border border-white/10 bg-white/5">
            <h2 className="text-white text-[22px] font-bold px-6 pb-3 pt-5 border-b border-white/10">
                Account Details
            </h2>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <p className="text-white/60 text-sm">Username</p>
                    <p className="text-white text-base">{user.pseudo}</p>
                </div>
                <div>
                    <p className="text-white/60 text-sm">Email</p>
                    <p className="text-white text-base">{user.email}</p>
                </div>
                <div>
                    <p className="text-white/60 text-sm">Account created</p>
                    <p className="text-white text-base">
                        {user.created_at
                            ? new Date(user.created_at).toLocaleString()
                            : "-"}
                    </p>
                </div>
                <div>
                    <p className="text-white/60 text-sm">Role</p>
                    <p className="text-white text-base">{user.role}</p>
                </div>
            </div>
        </div>
    );
}
