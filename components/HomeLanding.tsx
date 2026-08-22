"use client";

import Link from "next/link";
import { useState } from "react";
import { GodraysHero } from "@/components/GodraysHero";
import { RemoteImage } from "@/components/RemoteImage";
import { site } from "@/content/site";
import { isGifSrc } from "@/lib/media-src";

type Hotspot = {
  id: string;
  label: string;
  src: string;
  alt: string;
};

const hotspots: Record<string, Hotspot> = {
  light: {
    id: "light",
    label: "light",
    src: "/images/home/gallery/01-light.gif",
    alt: "Torre Glòries Content",
  },
  installation: {
    id: "installation",
    label: "installations",
    src: "/images/home/gallery/02-installations.jpg",
    alt: "CíCLIC",
  },
  immersive: {
    id: "immersive",
    label: "immersive spaces",
    src: "/images/home/gallery/03-immersive-spaces.jpg",
    alt: "Wonders",
  },
  realtime: {
    id: "realtime",
    label: "visuals",
    src: "/images/home/gallery/04-visuals.gif",
    alt: "Collide",
  },
};

export function HomeLanding() {
  const [firstName, lastName] = site.name.split(" ");
  const [active, setActive] = useState<Hotspot | null>(null);
  const [preview, setPreview] = useState({ x: 0, y: 0 });

  function reveal(hotspot: Hotspot, node: HTMLElement) {
    const rect = node.getBoundingClientRect();
    setPreview({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
    setActive(hotspot);
  }

  return (
    <section className="pointer-events-none relative -mt-[4.5rem] -mb-[4.5rem] flex h-dvh max-h-dvh flex-col justify-end overflow-hidden px-5 pb-28 pt-[7.5rem] md:-mt-[5.25rem] md:-mb-[5rem] md:px-8 md:pb-36 md:pt-[8.5rem]">
      <GodraysHero />

      <div className="relative mx-auto w-full max-w-[1600px]">
        <h1 className="mix-blend-difference font-display text-[clamp(3.5rem,14vw,9.5rem)] font-extrabold uppercase leading-[0.82] tracking-[-0.04em] text-white">
          <span className="block">{firstName}</span>
          <span className="block">{lastName}</span>
        </h1>

        <div className="mt-6 flex flex-col gap-8 md:mt-8 md:flex-row md:items-end md:justify-between md:gap-12">
          <p className="max-w-5xl font-sans text-[clamp(1.35rem,3.4vw,2.45rem)] font-medium lowercase leading-[1.28] tracking-[-0.02em] text-foreground">
            media artist & creative technologist working across{" "}
            <HotspotWord
              hotspot={hotspots.light}
              activeId={active?.id ?? null}
              onReveal={reveal}
              onHide={() => setActive(null)}
            />
            , spatial{" "}
            <HotspotWord
              hotspot={hotspots.installation}
              activeId={active?.id ?? null}
              onReveal={reveal}
              onHide={() => setActive(null)}
            />
            , through to{" "}
            <HotspotWord
              hotspot={hotspots.immersive}
              activeId={active?.id ?? null}
              onReveal={reveal}
              onHide={() => setActive(null)}
            />
            , and real-time{" "}
            <HotspotWord
              hotspot={hotspots.realtime}
              activeId={active?.id ?? null}
              onReveal={reveal}
              onHide={() => setActive(null)}
            />
            .
          </p>

          <div className="flex flex-wrap items-center gap-5 md:shrink-0">
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
      </div>

      {active ? (
        <div
          className="pointer-events-none fixed z-[60] -translate-x-1/2 -translate-y-[calc(100%+0.85rem)] bg-background shadow-[0_22px_50px_rgba(0,0,0,0.4)]"
          style={{ left: preview.x, top: preview.y }}
          role="img"
          aria-label={active.alt}
        >
          <RemoteImage
            src={active.src}
            alt={active.alt}
            width={1600}
            height={1200}
            unoptimized={isGifSrc(active.src)}
            className="block h-auto w-auto max-h-[min(58vh,36rem)] max-w-[min(88vw,44rem)]"
            style={{ width: "auto", height: "auto" }}
          />
        </div>
      ) : null}
    </section>
  );
}

function HotspotWord({
  hotspot,
  activeId,
  onReveal,
  onHide,
}: {
  hotspot: Hotspot;
  activeId: string | null;
  onReveal: (hotspot: Hotspot, node: HTMLElement) => void;
  onHide: () => void;
}) {
  const isActive = activeId === hotspot.id;

  return (
    <span
      role="button"
      tabIndex={0}
      aria-expanded={isActive}
      aria-label={`${hotspot.label}, preview`}
      className={`pointer-events-auto inline cursor-default align-baseline font-display text-[1.08em] font-extrabold lowercase tracking-[-0.03em] text-accent transition-opacity hover:opacity-80 ${
        isActive ? "opacity-100" : ""
      }`}
      onPointerEnter={(event) => onReveal(hotspot, event.currentTarget)}
      onPointerLeave={onHide}
      onFocus={(event) => onReveal(hotspot, event.currentTarget)}
      onBlur={onHide}
    >
      {hotspot.label}
    </span>
  );
}
