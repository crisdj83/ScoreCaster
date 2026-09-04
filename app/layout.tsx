import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import { LocaleProvider } from "./components/LocaleProvider";
import { getServerLocale } from "../lib/i18n-server";
import { getTranslations } from "../lib/i18n";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const t = getTranslations(getServerLocale());
  return {
    title: t("ScoreCaster | Premier League Predictions"),
    description: t("Predict match scores and compete with friends."),
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = getServerLocale();
  return (
    <html lang={locale}>
      <body className={`${inter.className} bg-[#151515] min-h-screen flex flex-col`}>
        <Navbar />
        <LocaleProvider initialLocale={locale}>
          <main className="mx-auto w-full max-w-7xl flex-grow px-3 py-5 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </LocaleProvider>
      </body>
    </html>
  );
}