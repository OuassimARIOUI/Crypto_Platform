"use client";

import { useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";

const API_BASE = "http://localhost:3004";

function formatDate(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString();
}

function formatRelativeTime(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";

    const diffMs = d.getTime() - Date.now();
    const diffSec = Math.round(diffMs / 1000);
    const abs = Math.abs(diffSec);

    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

    if (abs < 60) return rtf.format(diffSec, "second");
    const diffMin = Math.round(diffSec / 60);
    if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
    const diffHr = Math.round(diffMin / 60);
    if (Math.abs(diffHr) < 24) return rtf.format(diffHr, "hour");
    const diffDay = Math.round(diffHr / 24);
    return rtf.format(diffDay, "day");
}

function otherParticipant(convo, myUserId) {
    const list = convo?.participants || [];
    return list.find((p) => p.id !== myUserId) || list[0] || null;
}

function isBanNoticeMessage(body) {
    return typeof body === "string" && body.startsWith("[BAN]\n");
}

function displayMessageBody(body) {
    if (isBanNoticeMessage(body)) return body.replace(/^\[BAN\]\n/, "");
    return body;
}

export default function MessagingDock({ me }) {
    const [mounted, setMounted] = useState(false);
    const [token, setToken] = useState(null);

    const [open, setOpen] = useState(false);
    const [error, setError] = useState("");

    const [conversations, setConversations] = useState([]);
    const [selectedId, setSelectedId] = useState(null);

    const [messages, setMessages] = useState([]);
    const [messageDraft, setMessageDraft] = useState("");

    const [startPseudo, setStartPseudo] = useState("");

    const [loadingConversations, setLoadingConversations] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);

    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Avoid hydration mismatch: server render and first client render must match.
        setMounted(true);
        setToken(Cookies.get("token") || null);
    }, []);

    async function fetchConversations({ silent = false } = {}) {
        if (!token) return;
        if (!silent) setLoadingConversations(true);
        try {
            const res = await fetch(`${API_BASE}/messages/conversations`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Failed to load conversations");
            setConversations(data.conversations || []);
        } catch (e) {
            setError(e?.message || "Failed to load conversations");
        } finally {
            if (!silent) setLoadingConversations(false);
        }
    }

    async function fetchMessages(conversationId, { silent = false } = {}) {
        if (!token) return;
        if (!conversationId) return;
        if (!silent) setLoadingMessages(true);
        try {
            const res = await fetch(`${API_BASE}/messages/conversations/${conversationId}/messages?limit=50`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Failed to load messages");
            setMessages(data.messages || []);
        } catch (e) {
            setError(e?.message || "Failed to load messages");
        } finally {
            if (!silent) setLoadingMessages(false);
        }
    }

    async function startConversation() {
        if (!token) return;
        const pseudo = startPseudo.trim();
        if (!pseudo) return;
        setError("");
        try {
            const res = await fetch(`${API_BASE}/messages/conversations/start`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ pseudo }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Failed to start conversation");

            await fetchConversations({ silent: true });
            setSelectedId(data.conversation?.id ?? null);
            setStartPseudo("");
        } catch (e) {
            setError(e?.message || "Failed to start conversation");
        }
    }

    async function sendMessage() {
        if (!token) return;
        if (!selectedId) return;
        const body = messageDraft.trim();
        if (!body) return;

        setSending(true);
        setError("");
        try {
            const res = await fetch(`${API_BASE}/messages/conversations/${selectedId}/messages`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ body }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Failed to send");

            setMessageDraft("");
            await fetchMessages(selectedId, { silent: true });
            await fetchConversations({ silent: true });
        } catch (e) {
            setError(e?.message || "Failed to send");
        } finally {
            setSending(false);
        }
    }

    useEffect(() => {
        if (!open) return;
        setError("");
        fetchConversations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    useEffect(() => {
        if (!open) return;
        if (!selectedId) return;
        fetchMessages(selectedId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, selectedId]);

    useEffect(() => {
        if (!open) return;
        const t = setInterval(() => {
            fetchConversations({ silent: true });
            if (selectedId) fetchMessages(selectedId, { silent: true });
        }, 5000);
        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, selectedId]);

    useEffect(() => {
        if (!open) return;
        if (!selectedId) return;
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 50);
    }, [open, selectedId, messages.length]);

    if (!mounted) return null;
    if (!token) return null;

    const myUserId = me?.id;
    const selectedConversation = conversations.find((c) => c.id === selectedId) || null;
    const peer = selectedConversation ? otherParticipant(selectedConversation, myUserId) : null;

    return (
        <>
            {/* Toggle button stuck to the right wall */}
            <button
                onClick={() => setOpen((v) => !v)}
                className="fixed right-0 bottom-24 z-50 rounded-l-xl border border-white/10 bg-white/10 px-3 py-3 text-xs font-semibold text-white hover:bg-white/15"
                aria-label="Open messaging"
            >
                Messages
            </button>

            {open && (
                <div className="fixed bottom-4 right-4 z-50 flex max-w-[92vw] gap-3">
                    {/* Conversations panel (bottom-right modal) */}
                    <div className="w-72 rounded-xl border border-white/10 bg-background-dark/95 backdrop-blur p-3">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-white">Conversations</div>
                            <button
                                onClick={() => setOpen(false)}
                                className="rounded-md bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/15"
                            >
                                Close
                            </button>
                        </div>

                        <div className="mt-3 flex gap-2">
                            <input
                                value={startPseudo}
                                onChange={(e) => setStartPseudo(e.target.value)}
                                placeholder="Pseudo..."
                                className="w-full rounded-md border border-white/10 bg-background-dark px-3 py-2 text-xs text-white placeholder:text-gray-500"
                            />
                            <button
                                onClick={startConversation}
                                className="rounded-md bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/15"
                            >
                                New
                            </button>
                        </div>

                        {error && (
                            <div className="mt-3 rounded-lg border border-red-500/30 bg-red-600/15 px-3 py-2 text-xs text-red-200">
                                {error}
                            </div>
                        )}

                        <div className="mt-3 max-h-80 overflow-auto rounded-lg border border-white/10">
                            {loadingConversations ? (
                                <div className="px-3 py-3 text-xs text-gray-400">Loading...</div>
                            ) : conversations.length === 0 ? (
                                <div className="px-3 py-3 text-xs text-gray-400">No conversations</div>
                            ) : (
                                <div className="divide-y divide-white/10">
                                    {conversations.map((c) => {
                                        const p = otherParticipant(c, myUserId);
                                        const last = c.lastMessage;
                                        const active = c.id === selectedId;

                                        return (
                                            <button
                                                key={c.id}
                                                onClick={() => setSelectedId(c.id)}
                                                className={`w-full px-3 py-2 text-left hover:bg-white/5 ${
                                                    active ? "bg-white/5" : ""
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="truncate text-xs font-semibold text-white">
                                                        {p?.pseudo ?? "Unknown"}
                                                    </div>
                                                    <div className="shrink-0 text-[11px] text-gray-500">
                                                        {last?.at ? formatRelativeTime(last.at) : ""}
                                                    </div>
                                                </div>
                                                <div className="mt-1 truncate text-[11px] text-gray-400">
                                                    {last?.body ?? ""}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Conversation panel beside the list */}
                    <div className="w-96 max-w-[60vw] rounded-xl border border-white/10 bg-background-dark/95 backdrop-blur p-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-white">
                                    {peer?.pseudo ? `@${peer.pseudo}` : "Select a conversation"}
                                </div>
                                {peer?.role && (
                                    <div className="mt-0.5 text-xs text-gray-400">{peer.role}</div>
                                )}
                            </div>

                            <button
                                onClick={() => {
                                    fetchMessages(selectedId);
                                    fetchConversations();
                                }}
                                disabled={!selectedId || loadingMessages}
                                className="rounded-md bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/15 disabled:opacity-60"
                            >
                                {loadingMessages ? "Loading..." : "Reload"}
                            </button>
                        </div>

                        <div className="mt-3 h-72 overflow-auto rounded-lg border border-white/10 p-3">
                            {!selectedId ? (
                                <div className="text-xs text-gray-400">Pick a conversation from the list.</div>
                            ) : loadingMessages && messages.length === 0 ? (
                                <div className="text-xs text-gray-400">Loading...</div>
                            ) : messages.length === 0 ? (
                                <div className="text-xs text-gray-400">No messages yet.</div>
                            ) : (
                                <div className="space-y-3">
                                    {messages.map((m) => {
                                        const mine = m.sender?.id === myUserId;
                                        const isBan = isBanNoticeMessage(m.body);
                                        return (
                                            <div
                                                key={m.id}
                                                className={`flex ${mine ? "justify-end" : "justify-start"}`}
                                            >
                                                <div
                                                    className={`max-w-[80%] rounded-xl border border-white/10 px-3 py-2 ${
                                                        isBan
                                                            ? "border-red-500/30 bg-red-600/15"
                                                            : mine
                                                                ? "bg-white/10"
                                                                : "bg-white/5"
                                                    }`}
                                                >
                                                    <div className="text-[11px] text-gray-400">
                                                        {mine ? "You" : m.sender?.pseudo} · {formatDate(m.at)}
                                                    </div>
                                                    <div
                                                        className={`mt-1 whitespace-pre-wrap text-xs ${
                                                            isBan ? "text-red-100" : "text-white"
                                                        }`}
                                                    >
                                                        {displayMessageBody(m.body)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        <div className="mt-3 flex gap-2">
                            <input
                                value={messageDraft}
                                onChange={(e) => setMessageDraft(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") sendMessage();
                                }}
                                disabled={!selectedId || sending}
                                placeholder={selectedId ? "Type a message..." : "Select a conversation first"}
                                className="w-full rounded-md border border-white/10 bg-background-dark px-3 py-2 text-xs text-white placeholder:text-gray-500 disabled:opacity-60"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!selectedId || sending}
                                className="rounded-md bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15 disabled:opacity-60"
                            >
                                Send
                            </button>
                        </div>

                        <div className="mt-2 text-[11px] text-gray-500">
                            This panel overlays the current page.
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
