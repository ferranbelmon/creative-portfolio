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
    <section className="pointer-events-none relative -mt-[4.5rem] -mb-[4.5rem] flex h-dvh max-h-dvh flex-col justify-end overflow-hidden px-5 pb-32 pt-[6.5rem] md:-mt-[5.25rem] md:-mb-[5rem] md:px-8 md:pb-36 md:pt-[8.5rem]">
      <GodraysHero />

      <div className="relative mx-auto w-full min-w-0 max-w-[1600px]">
        <h1 className="mix-blend-difference font-display text-[clamp(2.35rem,min(12vw,11dvh),9.5rem)] font-extrabold uppercase leading-[0.82] tracking-[-0.04em] text-white">
          <span className="block">{firstName}</span>
          <span className="block">{lastName}</span>
        </h1>

        <div className="mt-4 flex flex-col gap-6 md:mt-8 md:flex-row md:items-end md:justify-between md:gap-12">
          <p className="max-w-5xl font-sans text-[clamp(1.2rem,min(4.4vw,3.6dvh),2.45rem)] font-medium lowercase leading-[1.3] tracking-[-0.02em] md:text-[clamp(1.2rem,min(3.6vw,2.8dvh),2.45rem)]">
            <span className="text-black">
              media artist & creative technologist working across{" "}
            </span>
            <HotspotWord
              hotspot={hotspots.light}
              activeId={active?.id ?? null}
              onReveal={reveal}
              onHide={() => setActive(null)}
            />
            <span className="text-black">, spatial </span>
            <HotspotWord
              hotspot={hotspots.installation}
              activeId={active?.id ?? null}
              onReveal={reveal}
              onHide={() => setActive(null)}
            />
            <span className="text-black">, through to </span>
            <HotspotWord
              hotspot={hotspots.immersive}
              activeId={active?.id ?? null}
              onReveal={reveal}
              onHide={() => setActive(null)}
            />
            <span className="text-black">, and real-time </span>
            <HotspotWord
              hotspot={hotspots.realtime}
              activeId={active?.id ?? null}
              onReveal={reveal}
              onHide={() => setActive(null)}
            />
            <span className="text-black">.</span>
          </p>

          <div className="flex w-full flex-col items-end gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-5 md:w-auto md:shrink-0">
            <Link
              href="/work"
              data-ui-tone="classic"
              className="pointer-events-auto inline-flex items-center gap-3 rounded-md border border-border bg-background/60 px-6 py-3 font-display text-sm font-bold uppercase tracking-[0.22em] backdrop-blur-sm transition-colors hover:border-accent hover:text-accent md:gap-4 md:px-8 md:py-4 md:text-base"
            >
              View work
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
