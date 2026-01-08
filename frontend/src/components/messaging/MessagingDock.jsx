"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import Cookies from "js-cookie";

const API_BASE = "http://localhost:3004";

// ============================================================================
// Utility Functions
// ============================================================================

function formatTime(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

function formatDateSeparator(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    
    return d.toLocaleDateString(undefined, { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function otherParticipant(convo, myUserId) {
    const list = convo?.participants || [];
    return list.find((p) => p.id !== myUserId) || list[0] || null;
}

function isBanNoticeMessage(body) {
    return typeof body === "string" && body.startsWith("[BAN]\n");
}

function isTransferNoticeMessage(body) {
    return typeof body === "string" && body.startsWith("[TRANSFER]\n");
}

function displayMessageBody(body) {
    if (isBanNoticeMessage(body)) return body.replace(/^\[BAN\]\n/, "");
    if (isTransferNoticeMessage(body)) return body.replace(/^\[TRANSFER\]\n/, "");
    return body;
}

function getInitials(name) {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function getAvatarColor(name) {
    if (!name) return "from-gray-500 to-gray-600";
    const colors = [
        "from-violet-500 to-purple-600",
        "from-blue-500 to-cyan-600",
        "from-emerald-500 to-teal-600",
        "from-orange-500 to-amber-600",
        "from-pink-500 to-rose-600",
        "from-indigo-500 to-blue-600",
        "from-cyan-500 to-blue-600",
        "from-fuchsia-500 to-pink-600",
    ];
    const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
}

// ============================================================================
// Icons
// ============================================================================

const Icons = {
    Messages: () => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
    ),
    Close: () => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
    Send: () => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
    ),
    Search: () => (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    ),
    Plus: () => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    ),
    ArrowLeft: () => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
    ),
    DoubleCheck: () => (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13l4 4L23 7" opacity={0.5} />
        </svg>
    ),
    Refresh: () => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
    ),
    Ban: () => (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
    ),
    Money: () => (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
};

// ============================================================================
// Avatar Component
// ============================================================================

function Avatar({ name, size = "md", showOnline = false }) {
    const sizeClasses = {
        sm: "w-8 h-8 text-xs",
        md: "w-10 h-10 text-sm",
        lg: "w-12 h-12 text-base",
        xl: "w-14 h-14 text-lg",
    };

    return (
        <div className="relative flex-shrink-0">
            <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${getAvatarColor(name)} flex items-center justify-center font-semibold text-white shadow-lg`}>
                {getInitials(name)}
            </div>
            {showOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full" />
            )}
        </div>
    );
}

// ============================================================================
// Message Bubble Component
// ============================================================================

function MessageBubble({ message, isMine, showAvatar, senderName }) {
    const isBan = isBanNoticeMessage(message.body);
    const isTransfer = isTransferNoticeMessage(message.body);
    
    const bubbleStyle = isBan
        ? "bg-gradient-to-r from-red-500/20 to-red-600/10 border-red-500/30"
        : isTransfer
            ? "bg-gradient-to-r from-green-500/20 to-emerald-600/10 border-green-500/30"
            : isMine
                ? "bg-gradient-to-r from-violet-600 to-purple-600 border-transparent"
                : "bg-white/5 border-white/10";

    const textStyle = isBan
        ? "text-red-100"
        : isTransfer
            ? "text-green-100"
            : "text-white";

    return (
        <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-3 group`}>
            {!isMine && showAvatar && (
                <div className="mr-2 flex-shrink-0 self-end">
                    <Avatar name={senderName} size="sm" />
                </div>
            )}
            {!isMine && !showAvatar && <div className="w-10 mr-2" />}
            
            <div className={`max-w-[75%] ${isMine ? "items-end" : "items-start"}`}>
                {(isBan || isTransfer) && (
                    <div className={`flex items-center gap-1.5 mb-1 text-xs ${isBan ? "text-red-400" : "text-green-400"}`}>
                        {isBan ? <Icons.Ban /> : <Icons.Money />}
                        <span>{isBan ? "System Notice" : "Transfer Notification"}</span>
                    </div>
                )}
                
                <div className={`relative px-4 py-2.5 rounded-2xl border ${bubbleStyle} ${isMine ? "rounded-br-md" : "rounded-bl-md"} shadow-lg`}>
                    <p className={`text-sm whitespace-pre-wrap break-words ${textStyle}`}>
                        {displayMessageBody(message.body)}
                    </p>
                    
                    <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
                        <span className="text-[10px] text-gray-400/80">
                            {formatTime(message.at)}
                        </span>
                        {isMine && (
                            <span className="text-violet-300">
                                <Icons.DoubleCheck />
                            </span>
                        )}
                    </div>
                </div>
            </div>
            
            {isMine && showAvatar && (
                <div className="ml-2 flex-shrink-0 self-end">
                    <Avatar name="You" size="sm" />
                </div>
            )}
            {isMine && !showAvatar && <div className="w-10 ml-2" />}
        </div>
    );
}

// ============================================================================
// Conversation Item Component
// ============================================================================

function ConversationItem({ conversation, isActive, onClick, myUserId, searchQuery }) {
    const peer = otherParticipant(conversation, myUserId);
    const lastMessage = conversation.lastMessage;
    const hasUnread = conversation.unreadCount > 0;
    
    const peerName = peer?.pseudo ?? "Unknown";
    const matchesSearch = searchQuery && peerName.toLowerCase().includes(searchQuery.toLowerCase());

    return (
        <button
            onClick={onClick}
            className={`w-full p-3 flex items-center gap-3 transition-all duration-200 hover:bg-white/5 ${
                isActive 
                    ? "bg-gradient-to-r from-violet-600/20 to-purple-600/10 border-l-2 border-violet-500" 
                    : "border-l-2 border-transparent"
            }`}
        >
            <div className="relative">
                <Avatar name={peerName} size="md" showOnline={peer?.isOnline} />
                {hasUnread && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-violet-500 text-[10px] font-bold text-white px-1">
                        {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                    </span>
                )}
            </div>
            
            <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between gap-2">
                    <span className={`font-semibold text-sm truncate ${hasUnread ? "text-white" : "text-gray-200"} ${matchesSearch ? "text-violet-400" : ""}`}>
                        {peerName}
                    </span>
                    <span className="text-[11px] text-gray-500 flex-shrink-0">
                        {lastMessage?.at ? formatRelativeTime(lastMessage.at) : ""}
                    </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    <p className={`text-xs truncate ${hasUnread ? "text-gray-300 font-medium" : "text-gray-500"}`}>
                        {lastMessage?.body 
                            ? displayMessageBody(lastMessage.body).slice(0, 40) + (lastMessage.body.length > 40 ? "..." : "")
                            : "No messages yet"
                        }
                    </p>
                </div>
            </div>
        </button>
    );
}

// ============================================================================
// Empty State Component
// ============================================================================

function EmptyState({ title, description, icon: Icon }) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                {Icon && <Icon />}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-400 max-w-[250px]">{description}</p>
        </div>
    );
}

// ============================================================================
// New Conversation Modal
// ============================================================================

function NewConversationModal({ isOpen, onClose, onStart }) {
    const [pseudo, setPseudo] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!pseudo.trim()) return;
        
        setLoading(true);
        setError("");
        
        try {
            await onStart(pseudo.trim());
            setPseudo("");
            onClose();
        } catch (err) {
            setError(err.message || "Failed to start conversation");
        } finally {
            setLoading(false);
        }
    };
    
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-violet-600/20 to-purple-600/20">
                    <h3 className="text-lg font-semibold text-white">New Conversation</h3>
                    <p className="text-sm text-gray-400 mt-1">Start a chat with another user</p>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="relative">
                        <input
                            type="text"
                            value={pseudo}
                            onChange={(e) => setPseudo(e.target.value)}
                            placeholder="Enter username..."
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                            autoFocus
                        />
                    </div>
                    
                    {error && (
                        <div className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                            <p className="text-sm text-red-300">{error}</p>
                        </div>
                    )}
                    
                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!pseudo.trim() || loading}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Starting..." : "Start Chat"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export default function MessagingDock({ me }) {
    const [mounted, setMounted] = useState(false);
    const [token, setToken] = useState(null);

    const [open, setOpen] = useState(false);
    const [showNewModal, setShowNewModal] = useState(false);
    const [error, setError] = useState("");

    const [conversations, setConversations] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    const [messages, setMessages] = useState([]);
    const [messageDraft, setMessageDraft] = useState("");

    const [loadingConversations, setLoadingConversations] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);

    const [unreadCount, setUnreadCount] = useState(0);
    const [mobileView, setMobileView] = useState("list");

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const sseRef = useRef(null);

    useEffect(() => {
        setMounted(true);
        setToken(Cookies.get("token") || null);
    }, []);

    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) return conversations;
        return conversations.filter(c => {
            const peer = otherParticipant(c, me?.id);
            return peer?.pseudo?.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [conversations, searchQuery, me?.id]);

    const groupedMessages = useMemo(() => {
        const groups = [];
        let currentDate = null;
        
        messages.forEach((msg, index) => {
            const msgDate = new Date(msg.at).toDateString();
            if (msgDate !== currentDate) {
                currentDate = msgDate;
                groups.push({ type: "date", date: msg.at, id: `date-${index}` });
            }
            groups.push({ type: "message", ...msg });
        });
        
        return groups;
    }, [messages]);

    async function fetchUnreadCount({ silent = false } = {}) {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE}/messages/unread-count`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Failed to load unread count");
            setUnreadCount(Number(data.unreadCount) || 0);
        } catch (e) {
            if (!silent) setError(e?.message || "Failed to load unread count");
        }
    }

    useEffect(() => {
        if (!mounted) return;
        if (!token) return;

        fetchUnreadCount({ silent: true });

        const url = `${API_BASE}/realtime/stream?token=${encodeURIComponent(token)}`;
        const es = new EventSource(url);
        sseRef.current = es;

        const onUnread = (ev) => {
            try {
                const data = JSON.parse(ev.data || "{}");
                setUnreadCount(Number(data.unreadCount) || 0);
            } catch { /* ignore */ }
        };

        const onMessageNew = () => {
            fetchConversations({ silent: true });
            if (open && selectedId) {
                fetchMessages(selectedId, { silent: true });
            }
        };

        es.addEventListener("messages:unread_count", onUnread);
        es.addEventListener("message:new", onMessageNew);

        return () => {
            es.removeEventListener("messages:unread_count", onUnread);
            es.removeEventListener("message:new", onMessageNew);
            es.close();
            if (sseRef.current === es) sseRef.current = null;
        };
    }, [mounted, token, open, selectedId]);

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

    async function startConversation(pseudo) {
        if (!token) return;
        if (!pseudo) throw new Error("Username is required");
        
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
        setMobileView("chat");
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
            await fetchUnreadCount({ silent: true });
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
        fetchUnreadCount({ silent: true });
    }, [open]);

    useEffect(() => {
        if (!open) return;
        if (!selectedId) return;
        fetchMessages(selectedId);
        fetchUnreadCount({ silent: true });
    }, [open, selectedId]);

    useEffect(() => {
        if (!open) return;
        const t = setInterval(() => {
            fetchConversations({ silent: true });
            if (selectedId) fetchMessages(selectedId, { silent: true });
            fetchUnreadCount({ silent: true });
        }, 5000);
        return () => clearInterval(t);
    }, [open, selectedId]);

    useEffect(() => {
        if (!open) return;
        if (!selectedId) return;
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 50);
    }, [open, selectedId, messages.length]);

    useEffect(() => {
        if (selectedId && inputRef.current) {
            inputRef.current.focus();
        }
    }, [selectedId]);

    if (!mounted) return null;
    if (!token) return null;

    const myUserId = me?.id;
    const selectedConversation = conversations.find((c) => c.id === selectedId) || null;
    const peer = selectedConversation ? otherParticipant(selectedConversation, myUserId) : null;

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={() => setOpen((v) => !v)}
                className="fixed right-6 bottom-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/30 flex items-center justify-center transition-all duration-300 hover:scale-110 group"
                aria-label="Open messaging"
            >
                <Icons.Messages />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] flex items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white px-1 border-2 border-gray-900 animate-pulse">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
                
                <span className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10">
                    Messages
                </span>
            </button>

            {/* Chat Panel */}
            {open && (
                <div className="fixed bottom-24 right-6 z-50 w-[95vw] sm:w-[800px] h-[600px] max-h-[80vh] bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex">
                    
                    {/* Conversations Sidebar */}
                    <div className={`${mobileView === "chat" ? "hidden sm:flex" : "flex"} w-full sm:w-[320px] flex-col border-r border-white/10`}>
                        <div className="p-4 border-b border-white/10 bg-gradient-to-r from-violet-600/10 to-purple-600/10">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-white">Messages</h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowNewModal(true)}
                                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"
                                        title="New conversation"
                                    >
                                        <Icons.Plus />
                                    </button>
                                    <button
                                        onClick={() => setOpen(false)}
                                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all sm:hidden"
                                    >
                                        <Icons.Close />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search conversations..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500 transition-all"
                                />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Icons.Search />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="mx-4 mt-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                                <p className="text-sm text-red-300">{error}</p>
                            </div>
                        )}
                        
                        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {loadingConversations ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : filteredConversations.length === 0 ? (
                                <EmptyState
                                    title={searchQuery ? "No results" : "No conversations"}
                                    description={searchQuery ? "Try a different search term" : "Start a new conversation to begin chatting"}
                                    icon={Icons.Messages}
                                />
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {filteredConversations.map((c) => (
                                        <ConversationItem
                                            key={c.id}
                                            conversation={c}
                                            isActive={c.id === selectedId}
                                            onClick={() => {
                                                setSelectedId(c.id);
                                                setMobileView("chat");
                                            }}
                                            myUserId={myUserId}
                                            searchQuery={searchQuery}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className={`${mobileView === "list" ? "hidden sm:flex" : "flex"} flex-1 flex-col`}>
                        {!selectedId ? (
                            <div className="flex-1 flex items-center justify-center">
                                <EmptyState
                                    title="Select a conversation"
                                    description="Choose a conversation from the sidebar to start chatting"
                                    icon={Icons.Messages}
                                />
                            </div>
                        ) : (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-3">
                                    <button
                                        onClick={() => setMobileView("list")}
                                        className="p-2 rounded-xl hover:bg-white/10 text-white transition-all sm:hidden"
                                    >
                                        <Icons.ArrowLeft />
                                    </button>
                                    
                                    <Avatar name={peer?.pseudo} size="md" showOnline={peer?.isOnline} />
                                    
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-white truncate">
                                            {peer?.pseudo ?? "Unknown"}
                                        </h3>
                                        {peer?.role && (
                                            <p className="text-xs text-gray-400">{peer.role}</p>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                fetchMessages(selectedId);
                                                fetchConversations();
                                            }}
                                            disabled={loadingMessages}
                                            className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all disabled:opacity-50"
                                            title="Refresh"
                                        >
                                            <span className={loadingMessages ? "animate-spin inline-block" : ""}>
                                                <Icons.Refresh />
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => setOpen(false)}
                                            className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all hidden sm:block"
                                        >
                                            <Icons.Close />
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                    {loadingMessages && messages.length === 0 ? (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <EmptyState
                                            title="No messages yet"
                                            description="Send a message to start the conversation"
                                            icon={Icons.Messages}
                                        />
                                    ) : (
                                        <>
                                            {groupedMessages.map((item, index) => {
                                                if (item.type === "date") {
                                                    return (
                                                        <div key={item.id} className="flex items-center justify-center my-6">
                                                            <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
                                                                <span className="text-xs text-gray-400 font-medium">
                                                                    {formatDateSeparator(item.date)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                
                                                const isMine = item.sender?.id === myUserId;
                                                const prevItem = groupedMessages[index - 1];
                                                const showAvatar = prevItem?.type === "date" || 
                                                    (prevItem?.type === "message" && prevItem.sender?.id !== item.sender?.id);
                                                
                                                return (
                                                    <MessageBubble
                                                        key={item.id}
                                                        message={item}
                                                        isMine={isMine}
                                                        showAvatar={showAvatar}
                                                        senderName={item.sender?.pseudo}
                                                    />
                                                );
                                            })}
                                            <div ref={messagesEndRef} />
                                        </>
                                    )}
                                </div>
                                
                                {/* Message Input */}
                                <div className="p-4 border-t border-white/10 bg-white/5">
                                    <div className="flex items-end gap-3">
                                        <div className="flex-1 relative">
                                            <textarea
                                                ref={inputRef}
                                                value={messageDraft}
                                                onChange={(e) => setMessageDraft(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" && !e.shiftKey) {
                                                        e.preventDefault();
                                                        sendMessage();
                                                    }
                                                }}
                                                disabled={sending}
                                                placeholder="Type a message..."
                                                rows={1}
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all resize-none disabled:opacity-50"
                                                style={{ minHeight: "44px", maxHeight: "120px" }}
                                            />
                                        </div>
                                        
                                        <button
                                            onClick={sendMessage}
                                            disabled={!messageDraft.trim() || sending}
                                            className="p-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20"
                                        >
                                            {sending ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Icons.Send />
                                            )}
                                        </button>
                                    </div>
                                    
                                    <p className="text-[11px] text-gray-500 mt-2 text-center">
                                        Press Enter to send, Shift+Enter for new line
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* New Conversation Modal */}
            <NewConversationModal
                isOpen={showNewModal}
                onClose={() => setShowNewModal(false)}
                onStart={startConversation}
            />
        </>
    );
}
