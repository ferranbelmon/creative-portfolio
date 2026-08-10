import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
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

export const metadata: Metadata = {
  title: `${site.name} - ${site.title}`,
  description: site.bio[0],
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
          {`(function(){try{if(localStorage.getItem("theme")==="light")document.documentElement.classList.add("light");}catch(e){}})();`}
        </Script>
        <Suspense fallback={null}>
          <Header />
        </Suspense>
        {children}
        <Footer />
      </body>
    </html>
  );
}
