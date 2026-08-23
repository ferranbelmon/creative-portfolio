import type { Metadata } from "next";
import { HomeLanding } from "@/components/HomeLanding";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: site.name,
  description:
    "Media Artist & Creative Technologist focusing on light, real-time systems, and immersive spaces.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <main>
      <HomeLanding />
    </main>
  );
}
