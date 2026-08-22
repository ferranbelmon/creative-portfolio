"use client";

import Link from "next/link";
import { GodraysHero } from "@/components/GodraysHero";
import { site } from "@/content/site";

const tagline =
  "Media Artist & Creative Technologist focusing on light, real-time systems, and immersive spaces.";

export function HomeLanding() {
  return (
    <section className="relative flex min-h-[calc(100dvh-9rem)] flex-col justify-center overflow-hidden px-5 py-16 md:min-h-[calc(100dvh-10.5rem)] md:px-8 md:py-20">
      <GodraysHero />

      {/*
        No z-index on this wrapper — otherwise mix-blend can't fuse with the
        WebGL canvas behind. Title is a blend layer: white ↔ difference.
      */}
      <div className="pointer-events-none relative mx-auto w-full max-w-[1600px]">
        <p className="mb-4 font-mono text-[0.62rem] uppercase tracking-[0.32em] text-accent md:text-xs">
          {site.location}
        </p>

        <h1 className="pointer-events-none max-w-5xl font-display text-[clamp(2.75rem,11vw,7.5rem)] font-extrabold uppercase leading-[0.9] tracking-tight text-white mix-blend-difference">
          {site.name}
        </h1>

        <p className="mt-8 max-w-2xl text-[0.92rem] leading-relaxed text-foreground/75 md:mt-10 md:text-lg md:leading-relaxed">
          {tagline}
        </p>

        <div className="mt-12 flex flex-wrap items-center gap-5 md:mt-14">
          <Link
            href="/work"
            data-ui-tone="classic"
            className="pointer-events-auto inline-flex items-center gap-3 border border-border bg-background/60 px-5 py-2.5 font-display text-xs font-bold uppercase tracking-[0.22em] backdrop-blur-sm transition-colors hover:border-accent hover:text-accent md:text-sm"
          >
            View work
            <span aria-hidden>↓</span>
          </Link>
          <Link
            href="/about"
            data-ui-tone="classic"
            className="pointer-events-auto font-display text-xs font-bold uppercase tracking-[0.22em] text-muted transition-colors hover:text-accent md:text-sm"
          >
            About
          </Link>
        </div>
      </div>
    </section>
  );
}
