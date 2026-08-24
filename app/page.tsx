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
  },
  twitter: {
    card: "summary",
    title: site.name,
    description: site.shareDescription,
  },
};

export default function Home() {
  return (
    <main>
      <HomeLanding />
    </main>
  );
}
