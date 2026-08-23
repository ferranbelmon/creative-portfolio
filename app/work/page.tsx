import type { Metadata } from "next";
import { ProjectGrid } from "@/components/ProjectGrid";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Selected projects by Ferran Belmon — immersive installations, live AV, and creative technology.",
  alternates: {
    canonical: "/work",
  },
};

export default function WorkPage() {
  return (
    <main>
      <ProjectGrid />
    </main>
  );
}
