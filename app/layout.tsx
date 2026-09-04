import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ScoreCaster | Premier League Predictions",
  description: "Predict match scores and compete with friends.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#151515] min-h-screen flex flex-col`}>
        {/* Persistent Global Navigation */}
        <Navbar />

        {/* Main Content Area */}
        <main className="flex-grow container mx-auto px-4 py-6 md:py-8">
          {children}
        </main>
      </body>
    </html>
  );
}