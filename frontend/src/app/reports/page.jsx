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

export default function ReportsPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reports, setReports] = useState([]);

    const [decisionDraft, setDecisionDraft] = useState({});

    const token = useMemo(() => Cookies.get("token"), []);

    async function fetchReports() {
        const res = await fetch(`${API_BASE}/admin/reports?page=1&pageSize=50&status=open`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data?.error) throw new Error(data.error);
        setReports(data.reports ?? []);
    }

    async function refresh() {
        setError("");
        setLoading(true);
        try {
            await fetchReports();
        } catch (e) {
            setError(e?.message || "Failed to load reports");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function decide(reportId, decision) {
        setError("");
        try {
            const draft = decisionDraft[reportId] || {};
            const res = await fetch(`${API_BASE}/admin/reports/${reportId}/decision`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    decision,
                    note: draft.note || "",
                    banReason: draft.banReason || "",
                    duration: {
                        days: toNumber(draft.days),
                        hours: toNumber(draft.hours),
                        months: toNumber(draft.months),
                    },
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Decision failed");
            await fetchReports();
        } catch (e) {
            setError(e?.message || "Decision failed");
        }
    }

    return (
        <DashboardLayout>
            <div className="p-6 lg:p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-4xl font-black text-white">Reports</h1>
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
                                        <th className="px-4 py-3 text-left font-semibold">Id</th>
                                        <th className="px-4 py-3 text-left font-semibold">Reported</th>
                                        <th className="px-4 py-3 text-left font-semibold">Reporter</th>
                                        <th className="px-4 py-3 text-left font-semibold">Category</th>
                                        <th className="px-4 py-3 text-left font-semibold">Reason</th>
                                        <th className="px-4 py-3 text-left font-semibold">Created</th>
                                        <th className="px-4 py-3 text-left font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map((r) => {
                                        const draft = decisionDraft[r.id] || {};
                                        return (
                                            <tr key={r.id} className="border-t border-white/10">
                                                <td className="px-4 py-3 text-white">#{r.id}</td>
                                                <td className="px-4 py-3">
                                                    <div className="text-white">{r.reported_user?.pseudo}</div>
                                                    <div className="text-xs text-gray-400">{r.reported_user?.email}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-gray-200">{r.reported_by?.pseudo}</div>
                                                    <div className="text-xs text-gray-500">{r.reported_by?.email}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="rounded-md bg-white/5 px-2 py-1 text-xs text-gray-200">
                                                        {r.reason_category}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-200">
                                                    <div className="max-w-[420px] truncate">{r.reason_text}</div>
                                                    {r.evidence && (
                                                        <div className="mt-1 max-w-[420px] truncate text-xs text-gray-500">
                                                            evidence: {r.evidence}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-gray-400">{formatDate(r.created_at)}</td>
                                                <td className="px-4 py-3">
                                                    <div className="space-y-2">
                                                        <input
                                                            value={draft.banReason || ""}
                                                            onChange={(e) =>
                                                                setDecisionDraft((p) => ({
                                                                    ...p,
                                                                    [r.id]: { ...draft, banReason: e.target.value },
                                                                }))
                                                            }
                                                            placeholder="Ban reason (if banning)"
                                                            className="w-64 rounded-md border border-white/10 bg-background-dark px-2 py-1 text-xs text-white placeholder:text-gray-500"
                                                        />
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <input
                                                                value={draft.days || ""}
                                                                onChange={(e) =>
                                                                    setDecisionDraft((p) => ({
                                                                        ...p,
                                                                        [r.id]: { ...draft, days: e.target.value },
                                                                    }))
                                                                }
                                                                placeholder="Days"
                                                                className="w-16 rounded-md border border-white/10 bg-background-dark px-2 py-1 text-xs text-white placeholder:text-gray-500"
                                                            />
                                                            <input
                                                                value={draft.hours || ""}
                                                                onChange={(e) =>
                                                                    setDecisionDraft((p) => ({
                                                                        ...p,
                                                                        [r.id]: { ...draft, hours: e.target.value },
                                                                    }))
                                                                }
                                                                placeholder="Hours"
                                                                className="w-16 rounded-md border border-white/10 bg-background-dark px-2 py-1 text-xs text-white placeholder:text-gray-500"
                                                            />
                                                            <input
                                                                value={draft.months || ""}
                                                                onChange={(e) =>
                                                                    setDecisionDraft((p) => ({
                                                                        ...p,
                                                                        [r.id]: { ...draft, months: e.target.value },
                                                                    }))
                                                                }
                                                                placeholder="Months"
                                                                className="w-16 rounded-md border border-white/10 bg-background-dark px-2 py-1 text-xs text-white placeholder:text-gray-500"
                                                            />
                                                        </div>
                                                        <textarea
                                                            value={draft.note || ""}
                                                            onChange={(e) =>
                                                                setDecisionDraft((p) => ({
                                                                    ...p,
                                                                    [r.id]: { ...draft, note: e.target.value },
                                                                }))
                                                            }
                                                            placeholder="Admin note"
                                                            className="w-64 rounded-md border border-white/10 bg-background-dark px-2 py-2 text-xs text-white placeholder:text-gray-500"
                                                            rows={2}
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => decide(r.id, "ban")}
                                                                className="rounded-md bg-red-600/20 px-3 py-1 text-xs text-red-100 hover:bg-red-600/30"
                                                            >
                                                                Ban
                                                            </button>
                                                            <button
                                                                onClick={() => decide(r.id, "reject")}
                                                                className="rounded-md bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/15"
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="text-xs text-gray-500">
                    Showing only OPEN reports. Use backend query params to include other statuses.
                </div>
            </div>
        </DashboardLayout>
    );
}
