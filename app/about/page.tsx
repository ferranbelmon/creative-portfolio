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
    <main className="mx-auto max-w-[1600px] px-5 py-12 md:px-8 md:py-16">
      <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.35em] text-accent">
        About
      </p>
      <h1 className="font-display max-w-3xl text-[clamp(2rem,5vw,3.5rem)] font-extrabold uppercase leading-[0.95] tracking-tight">
        New media artist &amp; creative coder
      </h1>

      <div className="mt-10 grid gap-6 md:mt-12 md:gap-8 lg:grid-cols-[minmax(16rem,0.9fr)_1.25fr] lg:items-stretch">
        {/* Reserved media column — portrait image will go here */}
        <div
          aria-hidden
          className="relative hidden min-h-[24rem] overflow-hidden rounded-[1.35rem] border border-border bg-gradient-to-b from-foreground/[0.04] to-transparent lg:block"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,255,0,0.06),transparent_65%)]" />
        </div>

        <div className="flex min-w-0 flex-col justify-between">
          <div className="space-y-3.5 text-[0.92rem] leading-relaxed text-foreground/80 md:space-y-4 md:text-[0.98rem] md:leading-[1.65]">
            {site.bio.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </div>

          <a
            href={`mailto:${site.email}`}
            className="group mt-10 inline-flex items-center gap-3 font-display text-sm font-bold uppercase tracking-[0.25em]"
          >
            <span className="transition-colors group-hover:text-accent">
              Contact
            </span>
            <span className="inline-block h-px w-8 bg-foreground/70 transition-all group-hover:w-16 group-hover:bg-accent" />
          </a>
        </div>
      </div>
    </main>
  );
}
