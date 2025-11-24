import ForgotPasswordForm from "@/components/forms/ForgotPasswordForm";

export default function ForgotPasswordPage() {
    return (
        <div
            className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden"
            style={{
                backgroundImage:
                    'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDXEkAh6s7LrpuA6QLffbsGBRuh5wc9WI4mtIFKDdIvff8j4uEs4Rxm5dNAepscuNqlcNPOn3Sti1zaMhflYwuF4CEKUjO1ATMaLLDcOx_qiYNWxQzWkWhAhfrZpNyKns0wRH7IbYyDThnS3PLuYiOHpZjvDJRljh3DvN1s-AhRjuJdR2YEw9nI3pnKX5z_tmQBNLIbLE_ATICu9JQ5g88X4dmVvz-PomYgIfKmwKnqI9LKOpNHFCyqOO8SToux9cVMbU3yBbNIFJZM")',
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            {/* overlay */}
            <div className="absolute inset-0 bg-[#101c22]/80 backdrop-blur-sm"></div>

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
