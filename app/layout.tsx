import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import { Footer } from "@/components/Footer";
import { GoogleAnalyticsBeacon } from "@/components/GoogleAnalyticsBeacon";
import { Header } from "@/components/Header";
import { ScrollRail } from "@/components/ScrollRail";
import { ScrollToTop } from "@/components/ScrollToTop";
import { site } from "@/content/site";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const siteTitle = `${site.name} - ${site.title}`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: siteTitle,
    template: `%s — ${site.name}`,
  },
  description: site.bio[0],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: site.name,
    title: siteTitle,
    description: site.bio[0],
    images: [
      {
        url: site.logo,
        alt: site.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: site.bio[0],
    images: [site.logo],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${syne.variable} h-full`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full bg-background text-foreground antialiased"
        suppressHydrationWarning
      >
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{if(!localStorage.getItem("themeMigratedNight")){localStorage.setItem("theme","dark");localStorage.setItem("themeMigratedNight","1");}if(localStorage.getItem("theme")==="light")document.documentElement.classList.add("light");else document.documentElement.classList.remove("light");}catch(e){}})();`}
        </Script>
        <ScrollToTop />
        <ScrollRail />
        <Suspense fallback={null}>
          <div className="relative z-50">
            <Header />
          </div>
        </Suspense>
        <div
          id="main-scroll"
          className="relative z-10 min-w-0 overflow-x-hidden pt-[4.5rem] pb-[4.5rem] md:pt-[5.25rem] md:pb-[5rem]"
        >
          {children}
        </div>
        <div className="relative z-50">
          <Footer />
        </div>
        <Analytics />
        <GoogleAnalyticsBeacon />
      </body>
    </html>
  );
}
