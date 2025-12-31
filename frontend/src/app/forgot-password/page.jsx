import ForgotPasswordForm from "@/components/forms/ForgotPasswordForm";

export default function ForgotPasswordPage() {
    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col items-center justify-center bg-[#0A0E23] overflow-x-hidden p-4 sm:p-6 lg:p-8">

            {/* Background */}
            <div
                className="absolute inset-0 w-full h-full bg-center bg-cover opacity-30"
                style={{
                    backgroundImage:
                        `url("https://lh3.googleusercontent.com/aida-public/AB6AXuDyBroiDJnby3GMkVA97K-1ZymGAOfHWmi8SpM9cZfFR9FcFVHAUNMc-GHY7CfNQ4UR9rEb9niCqWbKJVqMNIYNnnjx1UAoiF_ZqlYkVnYErggEgh0P88EZj1Ab21-Dfo_LV4cyGKwCmULAepNknX_IiAAUw-mc0-aMEtbVSjOpf0ALsJgDAUHkTK1z4pPH9X3rdP_wHb_EdhjhCNzD2DVkXZvzYjSIwg4YLD92Yg4nAu7IL-wgkH-012A2B7j0EMTQmH9E7YbyJ17r")`,
                }}
            ></div>

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
