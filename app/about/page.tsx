import type { Metadata } from "next";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "About",
  description: site.bio[0],
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <main className="mx-auto min-w-0 max-w-[1600px] overflow-x-hidden px-5 py-12 md:px-8 md:py-16">
      <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.35em] text-accent">
        About
      </p>
      <h1 className="font-display max-w-3xl break-words text-[clamp(1.75rem,6.5vw,3.5rem)] font-extrabold uppercase leading-[0.95] tracking-tight">
        Media artist &amp; creative technologist
      </h1>

      <div className="mt-10 max-w-3xl min-w-0 md:mt-12">
        <div className="space-y-3.5 text-[0.92rem] leading-relaxed break-words text-foreground/80 md:space-y-4 md:text-[0.98rem] md:leading-[1.65]">
          {site.bio.map((paragraph) => (
            <p key={paragraph.slice(0, 32)}>{paragraph}</p>
          ))}
        </div>

        <a
          href={`mailto:${site.email}`}
          className="group mt-10 inline-flex max-w-full items-center gap-3 font-display text-sm font-bold uppercase tracking-[0.25em]"
        >
          <span className="transition-colors group-hover:text-accent">
            Contact
          </span>
          <span className="inline-block h-px w-8 shrink-0 bg-foreground/70 transition-all group-hover:w-16 group-hover:bg-accent" />
        </a>
      </div>
    </main>
  );
}
