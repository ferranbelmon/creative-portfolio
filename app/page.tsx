import type { Metadata } from "next";
import { HomeLanding } from "@/components/HomeLanding";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: {
    absolute: site.name,
  },
  description: site.shareDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: site.name,
    description: site.shareDescription,
    url: "/",
    images: [{ url: site.shareImage, alt: site.name }],
  },
  twitter: {
    card: "summary",
    title: site.name,
    description: site.shareDescription,
    images: [site.shareImage],
  },
};

export default function Home() {
  return (
    <main>
      <HomeLanding />
    </main>
  );
}
