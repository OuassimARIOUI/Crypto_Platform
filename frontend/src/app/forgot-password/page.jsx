import ForgotPasswordForm from "@/components/forms/ForgotPasswordForm";

export default function ForgotPasswordPage() {
    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col items-center justify-center bg-[#0A0E23] overflow-x-hidden p-4 sm:p-6 lg:p-8">

            {/* Background GIF */}
            <div
                className="absolute inset-0 w-full h-full bg-center bg-cover opacity-40"
                style={{
                    backgroundImage: `url("/bg.gif")`,
                }}
            ></div>
            {/* Overlay gradient for better readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0A0E23]/70 via-[#0A0E23]/50 to-[#0A0E23]/80"></div>

            {/* CONTENU */}
            <div className="relative z-10 flex w-full flex-col items-center px-4">
                {/* Logo Figma */}
                <div className="mb-8 flex items-center gap-3">
                    <span className="material-symbols-outlined 
                           text-primary 
                           text-[200px]      
                           drop-shadow-[0_0_12px_rgba(13,166,242,0.6)]  /* Glow bleu stylé */
                           font-bold
                        ">
                            currency_bitcoin
                        </span>

                    <p className="text-3xl font-bold tracking-tight text-white">
                        CryptoTrader
                    </p>
                </div>

                <ForgotPasswordForm />

                {/* Lien en dessous */}
                <div className="mt-8 text-center">
                    <p className="text-[#A0A0A0] text-sm">
                        Remembered your password?{" "}
                        <a href="/login" className="font-bold text-primary hover:underline">
                            Log In
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
