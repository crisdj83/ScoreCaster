import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Navbar from "./components/Navbar";
import SiteFooter from "./components/SiteFooter";
import { LocaleProvider } from "./components/LocaleProvider";
import { getServerLocale } from "../lib/i18n-server";
import { getTranslations } from "../lib/i18n";

const outfit = Outfit({ subsets: ["latin"], display: "swap" });

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
    <html lang={locale} className="dark">
      <body className={`${outfit.className} bg-scorecaster-bg text-scorecaster-text min-h-screen flex flex-col`}>
        <LocaleProvider initialLocale={locale}>
          <Navbar />
          <main className="mx-auto w-full flex-grow px-3 py-5 pb-24 sm:px-5 sm:py-6 lg:px-8 lg:py-8 lg:pb-8 xl:px-10">
            {children}
          </main>
          <div className="hidden lg:block">
            <SiteFooter />
          </div>
        </LocaleProvider>
        <Analytics />
      </body>
    </html>
  );
}
