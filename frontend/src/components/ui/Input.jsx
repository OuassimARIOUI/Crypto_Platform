import React from 'react';

export default function Input({ label, type = "text", value, onChange, placeholder }) {
    return (
        <div className="flex flex-col w-full gap-2">
            {label && <p className="text-white/80 text-sm">{label}</p>}
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="form-input w-full rounded-lg bg-white/10 border border-white/20 text-white h-14 px-4 focus:border-primary focus:ring-2 focus:ring-primary/40 transition-all"
            />
        </div>
    );
}
