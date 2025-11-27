import { Geist, Geist_Mono } from "next/font/google";
import { Manrope } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const manrope = Manrope({
    subsets: ["latin"],
    weight: ["200","300","400","500","600","700","800"],
});


export const metadata = {
  title: "CryptoTrade",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* MATERIAL SYMBOLS */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />
      </head>
      <body className={`${manrope.className} bg-[#0A0E23]`} > {children}</body>
    </html>
  );
}