"use client";

export default function Notification({
    type = "info", // info | success | error | warning
    message,
    onClose,
}) {
    if (!message) return null;

    const stylesByType = {
        info: "border-primary/30 bg-primary/15 text-primary",
        success: "border-green-500/30 bg-green-600/15 text-green-200",
        error: "border-red-500/30 bg-red-600/15 text-red-200",
        warning: "border-yellow-500/30 bg-yellow-600/15 text-yellow-100",
    };

    const styles = stylesByType[type] || stylesByType.info;

    return (
        <div className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="leading-snug">{message}</div>
                {typeof onClose === "function" && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-white/70 hover:text-white"
                        aria-label="Close notification"
                    >
                        ×
                    </button>
                )}
            </div>
        </div>
    );
}
