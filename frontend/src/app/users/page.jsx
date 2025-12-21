"use client";

import { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const API_BASE = "http://localhost:3004";

function formatDate(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString();
}

function toNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

export default function UsersPage() {
    const [me, setMe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [users, setUsers] = useState([]);

    const [expandedReportUserId, setExpandedReportUserId] = useState(null);
    const [reportForm, setReportForm] = useState({
        reasonCategory: "other",
        reasonText: "",
        evidence: "",
    });

    const [banDraft, setBanDraft] = useState({});

    const token = useMemo(() => Cookies.get("token"), []);

    async function fetchMe() {
        if (!token) return;
        const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data?.error) throw new Error(data.error);
        setMe(data);
    }

    async function fetchUsers() {
        if (!token) return;
        const res = await fetch(`${API_BASE}/admin/users?page=1&pageSize=50`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data?.error) throw new Error(data.error);
        setUsers(data.users ?? []);
    }

    async function refresh() {
        setError("");
        setLoading(true);
        try {
            await fetchMe();
            await fetchUsers();
        } catch (e) {
            setError(e?.message || "Failed to load users");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function submitReport(userId) {
        setError("");
        try {
            const res = await fetch(`${API_BASE}/reports`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    reportedUserId: userId,
                    reasonCategory: reportForm.reasonCategory,
                    reasonText: reportForm.reasonText,
                    evidence: reportForm.evidence || undefined,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Failed to create report");

            setExpandedReportUserId(null);
            setReportForm({ reasonCategory: "other", reasonText: "", evidence: "" });
        } catch (e) {
            setError(e?.message || "Failed to create report");
        }
    }

    async function banUser(userId) {
        setError("");
        try {
            const draft = banDraft[userId] || {};
            const res = await fetch(`${API_BASE}/admin/users/${userId}/ban`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    reason: draft.reason || "",
                    duration: {
                        days: toNumber(draft.days),
                        hours: toNumber(draft.hours),
                        months: toNumber(draft.months),
                    },
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Ban failed");
            await fetchUsers();
        } catch (e) {
            setError(e?.message || "Ban failed");
        }
    }

    async function unbanUser(userId) {
        setError("");
        try {
            const res = await fetch(`${API_BASE}/admin/users/${userId}/unban`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Unban failed");
            await fetchUsers();
        } catch (e) {
            setError(e?.message || "Unban failed");
        }
    }

    async function updateRole(userId, role) {
        setError("");
        try {
            const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ role }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Role update failed");
            await fetchUsers();
        } catch (e) {
            setError(e?.message || "Role update failed");
        }
    }

    const isAdmin = me?.role === "admin";
    const isModerator = me?.role === "moderator";

    return (
        <DashboardLayout>
            <div className="p-6 lg:p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-4xl font-black text-white">Users</h1>
                    <button
                        onClick={refresh}
                        className="rounded-lg bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10"
                    >
                        Refresh
                    </button>
                </div>

                {error && (
                    <div className="rounded-lg border border-red-500/30 bg-red-600/15 px-4 py-3 text-sm text-red-200">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-gray-400">Loading...</div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-white/5 text-gray-300">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold">Pseudo</th>
                                        <th className="px-4 py-3 text-left font-semibold">Email</th>
                                        <th className="px-4 py-3 text-left font-semibold">Role</th>
                                        <th className="px-4 py-3 text-left font-semibold">Status</th>
                                        <th className="px-4 py-3 text-right font-semibold">Balance</th>
                                        <th className="px-4 py-3 text-right font-semibold">Deposits</th>
                                        <th className="px-4 py-3 text-right font-semibold">Profit</th>
                                        <th className="px-4 py-3 text-left font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => {
                                        const isRestricted = u.status === "banned" || u.status === "suspended";
                                        const draft = banDraft[u.id] || {};

                                        return (
                                            <tr key={u.id} className="border-t border-white/10">
                                                <td className="px-4 py-3 text-white">{u.pseudo}</td>
                                                <td className="px-4 py-3 text-gray-300">{u.email}</td>
                                                <td className="px-4 py-3">
                                                    <span className="rounded-md bg-white/5 px-2 py-1 text-xs text-gray-200">
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span
                                                            className={`inline-flex w-fit rounded-md px-2 py-1 text-xs font-semibold ${
                                                                isRestricted
                                                                    ? "bg-red-600/15 text-red-200"
                                                                    : "bg-green-600/15 text-green-200"
                                                            }`}
                                                        >
                                                            {u.status}
                                                        </span>
                                                        {u.bannedUntil && (
                                                            <span className="mt-1 text-xs text-gray-400">
                                                                until {formatDate(u.bannedUntil)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right text-white">
                                                    {toNumber(u.portfolio?.balance).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-200">
                                                    {toNumber(u.portfolio?.totalDeposited).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-200">
                                                    {toNumber(u.portfolio?.profit).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {isAdmin ? (
                                                        <div className="space-y-2">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <select
                                                                    value={u.role}
                                                                    onChange={(e) => updateRole(u.id, e.target.value)}
                                                                    className="rounded-md border border-white/10 bg-background-dark px-2 py-1 text-xs text-white"
                                                                >
                                                                    <option value="user">user</option>
                                                                    <option value="moderator">moderator</option>
                                                                </select>

                                                                {isRestricted ? (
                                                                    <button
                                                                        onClick={() => unbanUser(u.id)}
                                                                        className="rounded-md bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/15"
                                                                    >
                                                                        Unban
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => banUser(u.id)}
                                                                        className="rounded-md bg-red-600/20 px-3 py-1 text-xs text-red-100 hover:bg-red-600/30"
                                                                    >
                                                                        Ban
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {!isRestricted && (
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <input
                                                                        value={draft.reason || ""}
                                                                        onChange={(e) =>
                                                                            setBanDraft((p) => ({
                                                                                ...p,
                                                                                [u.id]: { ...draft, reason: e.target.value },
                                                                            }))
                                                                        }
                                                                        placeholder="Reason"
                                                                        className="w-48 rounded-md border border-white/10 bg-background-dark px-2 py-1 text-xs text-white placeholder:text-gray-500"
                                                                    />
                                                                    <input
                                                                        value={draft.days || ""}
                                                                        onChange={(e) =>
                                                                            setBanDraft((p) => ({
                                                                                ...p,
                                                                                [u.id]: { ...draft, days: e.target.value },
                                                                            }))
                                                                        }
                                                                        placeholder="Days"
                                                                        className="w-16 rounded-md border border-white/10 bg-background-dark px-2 py-1 text-xs text-white placeholder:text-gray-500"
                                                                    />
                                                                    <input
                                                                        value={draft.hours || ""}
                                                                        onChange={(e) =>
                                                                            setBanDraft((p) => ({
                                                                                ...p,
                                                                                [u.id]: { ...draft, hours: e.target.value },
                                                                            }))
                                                                        }
                                                                        placeholder="Hours"
                                                                        className="w-16 rounded-md border border-white/10 bg-background-dark px-2 py-1 text-xs text-white placeholder:text-gray-500"
                                                                    />
                                                                    <input
                                                                        value={draft.months || ""}
                                                                        onChange={(e) =>
                                                                            setBanDraft((p) => ({
                                                                                ...p,
                                                                                [u.id]: { ...draft, months: e.target.value },
                                                                            }))
                                                                        }
                                                                        placeholder="Months"
                                                                        className="w-16 rounded-md border border-white/10 bg-background-dark px-2 py-1 text-xs text-white placeholder:text-gray-500"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : isModerator ? (
                                                        <div>
                                                            <button
                                                                onClick={() =>
                                                                    setExpandedReportUserId(
                                                                        expandedReportUserId === u.id ? null : u.id
                                                                    )
                                                                }
                                                                className="rounded-md bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/15"
                                                            >
                                                                Signal
                                                            </button>

                                                            {expandedReportUserId === u.id && (
                                                                <div className="mt-2 space-y-2 rounded-lg border border-white/10 bg-white/5 p-3">
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <select
                                                                            value={reportForm.reasonCategory}
                                                                            onChange={(e) =>
                                                                                setReportForm((p) => ({
                                                                                    ...p,
                                                                                    reasonCategory: e.target.value,
                                                                                }))
                                                                            }
                                                                            className="rounded-md border border-white/10 bg-background-dark px-2 py-1 text-xs text-white"
                                                                        >
                                                                            <option value="fraud">fraud</option>
                                                                            <option value="abuse">abuse</option>
                                                                            <option value="spam">spam</option>
                                                                            <option value="other">other</option>
                                                                        </select>
                                                                    </div>
                                                                    <textarea
                                                                        value={reportForm.reasonText}
                                                                        onChange={(e) =>
                                                                            setReportForm((p) => ({
                                                                                ...p,
                                                                                reasonText: e.target.value,
                                                                            }))
                                                                        }
                                                                        placeholder="Motif de signalement"
                                                                        className="w-full rounded-md border border-white/10 bg-background-dark px-3 py-2 text-xs text-white placeholder:text-gray-500"
                                                                        rows={3}
                                                                    />
                                                                    <input
                                                                        value={reportForm.evidence}
                                                                        onChange={(e) =>
                                                                            setReportForm((p) => ({
                                                                                ...p,
                                                                                evidence: e.target.value,
                                                                            }))
                                                                        }
                                                                        placeholder="Evidence (optional)"
                                                                        className="w-full rounded-md border border-white/10 bg-background-dark px-3 py-2 text-xs text-white placeholder:text-gray-500"
                                                                    />
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => submitReport(u.id)}
                                                                            className="rounded-md bg-primary/20 px-3 py-1 text-xs text-primary hover:bg-primary/30"
                                                                        >
                                                                            Submit
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setExpandedReportUserId(null)}
                                                                            className="rounded-md bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/15"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-500">No access</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
