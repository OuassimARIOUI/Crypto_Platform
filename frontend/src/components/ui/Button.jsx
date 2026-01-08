import React from 'react';

export default function Button({ children, onClick, type = "button", className = "", disabled = false }) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`w-full h-14 rounded-lg bg-primary text-white font-bold transition-all ${
                disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-primary/90"
            } ${className}`}
        >
            {children}
        </button>
    );
}
