import Link from "next/link";
import { site } from "@/content/site";

export default function AboutPage() {
  return (
    <main>
      <section className="border-b border-border px-5 py-12 md:px-8 md:py-20">
        <div className="mx-auto max-w-[1600px]">
          <p className="mb-6 text-xs font-bold uppercase tracking-[0.35em] text-accent">
            About
          </p>
          <h1 className="font-display max-w-4xl text-[clamp(2.5rem,8vw,5rem)] font-extrabold uppercase leading-[0.9] tracking-tight">
            New media artist & creative coder
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-24">
        <div className="space-y-8 text-lg leading-relaxed text-foreground/85 md:text-xl md:leading-relaxed">
          {site.bio.map((paragraph) => (
            <p key={paragraph.slice(0, 32)}>{paragraph}</p>
          ))}
        </div>

        <Link
          href={`mailto:${site.email}`}
          className="group mt-14 inline-flex items-center gap-3 font-display text-sm font-bold uppercase tracking-[0.25em]"
        >
          <span className="transition-colors group-hover:text-accent">Contact</span>
          <span className="inline-block h-px w-8 bg-foreground transition-all group-hover:w-16 group-hover:bg-accent" />
        </Link>
      </section>
    </main>
  );
}
