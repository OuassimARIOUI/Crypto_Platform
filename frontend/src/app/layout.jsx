import "../app/globals.css";

export const metadata = {
    title: "Crypto Platform",
    description: "Crypto dashboard",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
        <body>{children}</body>
        </html>
    );
}
