export default function Button({ children, onClick, type = "button", className = "" }) {
    return (
        <button
            type={type}
            onClick={onClick}
            className={`w-full h-14 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-all ${className}`}
        >
            {children}
        </button>
    );
}
