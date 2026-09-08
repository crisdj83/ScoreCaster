import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter_Tight } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Navbar from "./components/Navbar";
import SiteFooter from "./components/SiteFooter";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";
import { LocaleProvider } from "./components/LocaleProvider";
import { getServerLocale } from "../lib/i18n-server";
import { getTranslations } from "../lib/i18n";
import { siteUrl } from "../lib/urls";

const inter = Inter_Tight({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  themeColor: "#050506",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  const t = getTranslations(getServerLocale());
  const base = siteUrl();
  const title = t("XactScore | Premier League Predictions");
  const description = t("Predict match scores and compete with friends.");
  return {
    metadataBase: new URL(base),
    title,
    description,
    applicationName: "XactScore",
    keywords: ["Premier League", "score predictions", "football predictor", "private league", "XactScore"],
    openGraph: {
      type: "website",
      url: base,
      siteName: "XactScore",
      title,
      description,
      images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: "XactScore" }],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: ["/icons/icon-512.png"],
    },
    appleWebApp: {
      capable: true,
      title: "XactScore",
      statusBarStyle: "black-translucent",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = getServerLocale();
  return (
    <html lang={locale} className={`${inter.variable} dark`} suppressHydrationWarning>
      <body className="bg-xactscore-bg text-xactscore-text min-h-screen flex flex-col">
        <Script id="android-class" strategy="beforeInteractive">
          {`document.documentElement.classList.toggle("android",/Android/i.test(navigator.userAgent))`}
        </Script>
        <LocaleProvider initialLocale={locale}>
          <Navbar />
          <main className="mx-auto w-full flex-grow px-3 py-5 pb-24 sm:px-5 sm:py-6 lg:px-8 lg:py-8 lg:pb-8 xl:px-10">
            {children}
          </main>
          <div className="hidden lg:block">
            <SiteFooter />
          </div>
        </LocaleProvider>
        <ServiceWorkerRegister />
        <Analytics />
      </body>
    </html>
  );
}
