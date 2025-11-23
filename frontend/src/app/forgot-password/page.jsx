import ForgotPasswordForm from "@/components/forms/ForgotPasswordForm";

export default function ForgotPasswordPage() {
    return (
        <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-background-dark dark group/design-root"
             style={{
                 backgroundImage:
                     'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDXEkAh6s7LrpuA6QLffbsGBRuh5wc9WI4mtIFKDdIvff8j4uEs4Rxm5dNAepscuNqlcNPOn3Sti1zaMhflYwuF4CEKUjO1ATMaLLDcOx_qiYNWxQzWkWhAhfrZpNyKns0wRH7IbYyDThnS3PLuYiOHpZjvDJRljh3DvN1s-AhRjuJdR2YEw9nI3pnKX5z_tmQBNLIbLE_ATICu9JQ5g88X4dmVvz-PomYgIfKmwKnqI9LKOpNHFCyqOO8SToux9cVMbU3yBbNIFJZM")',
                 backgroundSize: "cover",
                 backgroundPosition: "center"
             }}
        >
            <div className="absolute inset-0 bg-background-dark/80 backdrop-blur-sm"></div>

            <div className="relative z-10 w-full max-w-md px-4">
                {/* Logo */}
                <div className="mb-8 flex items-center justify-center gap-3">
          <span className="material-symbols-outlined text-primary text-4xl">
            currency_bitcoin
          </span>
                    <p className="text-3xl font-bold tracking-tight text-white">
                        CryptoTrader
                    </p>
                </div>

                <ForgotPasswordForm />
            </div>
        </div>
    );
}
