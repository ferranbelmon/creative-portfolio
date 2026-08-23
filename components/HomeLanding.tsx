"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GodraysHero } from "@/components/GodraysHero";
import { ProjectSkills } from "@/components/ProjectSkills";
import { RemoteImage } from "@/components/RemoteImage";
import { getProjectBySlug, type Project } from "@/content/projects";
import { site } from "@/content/site";
import { isGifSrc } from "@/lib/media-src";
import {
  consumeScrollToSelectedWork,
  scrollToSelectedWork,
} from "@/lib/scroll-selected-work";

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

const SELECTED_WORK_SLUGS = [
  "ciclic",
  "espurna",
  "collide",
  "moonai-soundwaves-wellness",
  "cupra-sensorial-capsule",
  "visuals-for-boiler-room-primavera-sound-2024",
  "torre-glories-content",
  "color-conversations",
] as const;

const selectedProjects = SELECTED_WORK_SLUGS.map((slug) =>
  getProjectBySlug(slug),
).filter((project): project is Project => Boolean(project));

export function HomeLanding() {
  const [firstName, lastName] = site.name.split(" ");
  const [active, setActive] = useState<Hotspot | null>(null);
  const [preview, setPreview] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const shouldScroll =
      consumeScrollToSelectedWork() ||
      window.location.hash === "#selected-work-heading";
    if (!shouldScroll) return;

    const id = window.setTimeout(() => {
      scrollToSelectedWork();
    }, 80);
    return () => window.clearTimeout(id);
  }, []);

  function reveal(hotspot: Hotspot, node: HTMLElement) {
    const rect = node.getBoundingClientRect();
    setPreview({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
    setActive(hotspot);
  }

  return (
    <>
      <section className="pointer-events-none relative -mt-[4.5rem] flex h-dvh max-h-dvh flex-col overflow-hidden px-5 pt-[5.5rem] pb-6 md:-mt-[5.25rem] md:px-8 md:pt-[8.5rem] md:pb-8">
        <GodraysHero />

        <div className="relative mx-auto flex min-h-0 w-full min-w-0 max-w-[1600px] flex-1 flex-col md:pb-[10vh]">
          <div className="flex min-h-0 flex-1 flex-col justify-center max-md:translate-y-[4vh] md:justify-end">
            <h1 className="mix-blend-difference font-display text-[clamp(2.35rem,min(12vw,11dvh),9.5rem)] font-extrabold uppercase leading-[0.82] tracking-[-0.04em] text-white">
              <span className="block">{firstName}</span>
              <span className="block">{lastName}</span>
            </h1>

            <div className="mt-4 md:mt-8">
              <p className="max-w-5xl font-sans text-[clamp(1.2rem,min(4.4vw,3.6dvh),2.45rem)] font-medium lowercase leading-[1.3] tracking-[-0.02em] md:text-[clamp(1.2rem,min(3.6vw,2.8dvh),2.45rem)]">
                <span className="text-white mix-blend-difference light:text-white md:light:text-black md:light:mix-blend-normal">
                  media artist & creative technologist working across{" "}
                </span>
                <HotspotWord
                  hotspot={hotspots.light}
                  activeId={active?.id ?? null}
                  onReveal={reveal}
                  onHide={() => setActive(null)}
                />
                <span className="text-white mix-blend-difference light:text-white md:light:text-black md:light:mix-blend-normal">
                  , spatial{" "}
                </span>
                <HotspotWord
                  hotspot={hotspots.installation}
                  activeId={active?.id ?? null}
                  onReveal={reveal}
                  onHide={() => setActive(null)}
                />
                <span className="text-white mix-blend-difference light:text-white md:light:text-black md:light:mix-blend-normal">
                  , through to{" "}
                </span>
                <HotspotWord
                  hotspot={hotspots.immersive}
                  activeId={active?.id ?? null}
                  onReveal={reveal}
                  onHide={() => setActive(null)}
                />
                <span className="text-white mix-blend-difference light:text-white md:light:text-black md:light:mix-blend-normal">
                  , and real-time{" "}
                </span>
                <HotspotWord
                  hotspot={hotspots.realtime}
                  activeId={active?.id ?? null}
                  onReveal={reveal}
                  onHide={() => setActive(null)}
                />
                <span className="text-white mix-blend-difference light:text-white md:light:text-black md:light:mix-blend-normal">
                  .
                </span>
              </p>
            </div>

            <div className="pointer-events-none mt-12 flex w-full justify-end md:mt-8 md:w-[90%] md:self-end">
              <button
                type="button"
                data-ui-tone="classic"
                onClick={scrollToSelectedWork}
                className="pointer-events-auto inline-flex cursor-pointer items-center gap-3 rounded-md border-2 border-foreground/70 bg-background/60 px-6 py-3 font-display text-sm font-bold uppercase tracking-[0.22em] backdrop-blur-sm transition-colors hover:border-accent hover:text-accent md:gap-4 md:px-8 md:py-4 md:text-base"
              >
                Selected work
                <span aria-hidden className="text-lg leading-none md:text-xl">
                  ↓
                </span>
              </button>
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

      <section
        id="selected-work"
        className="relative min-h-dvh scroll-mt-[4.5rem] bg-background px-5 py-16 md:scroll-mt-[5.25rem] md:px-8 md:py-24"
      >
        <div className="mx-auto w-full max-w-[1600px]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-accent">
                // selected
              </p>
              <h2
                id="selected-work-heading"
                className="mt-3 scroll-mt-[4.5rem] font-display text-[clamp(1.8rem,4vw,3rem)] font-extrabold uppercase leading-[0.95] tracking-tight md:scroll-mt-[5.25rem]"
              >
                Selected work
              </h2>
            </div>
            <Link
              href="/work"
              data-ui-tone="classic"
              className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted transition-colors hover:text-accent"
            >
              All projects →
            </Link>
          </div>

          <div className="mx-auto mt-10 grid w-full grid-cols-1 gap-5 md:mt-14 md:w-[90%] md:gap-8">
            {selectedProjects.map((project) => (
              <SelectedWorkCard key={project.slug} project={project} />
            ))}
          </div>

          <div className="mx-auto mt-10 flex w-full justify-end md:mt-14 md:w-[90%]">
            <Link
              href="/work"
              data-ui-tone="classic"
              className="inline-flex cursor-pointer items-center gap-3 rounded-md border-2 border-foreground/70 bg-background/60 px-6 py-3 font-display text-sm font-bold uppercase tracking-[0.22em] backdrop-blur-sm transition-colors hover:border-accent hover:text-accent md:gap-4 md:px-8 md:py-4 md:text-base"
            >
              All works
              <span aria-hidden className="text-lg leading-none md:text-xl">
                →
              </span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function SelectedWorkCard({ project }: { project: Project }) {
  const meta = [project.year, project.client ?? project.event]
    .filter(Boolean)
    .join(" · ");
  const cover = project.thumbnail169 ?? project.thumbnail;
  const isCiclic = project.slug === "ciclic";

  return (
    <Link
      id={isCiclic ? "selected-work-ciclic" : undefined}
      href={`/projects/${project.slug}`}
      data-ui-tone="tonic"
      className="group relative flex h-full scroll-mt-[4.5rem] flex-col rounded-lg border border-border bg-surface outline-none transition-colors duration-300 hover:border-accent/60 hover:outline hover:outline-1 hover:outline-offset-0 hover:outline-accent/60 focus-visible:border-accent md:scroll-mt-[5.25rem]"
    >
      <div className="relative mx-3 mt-3 aspect-video overflow-hidden rounded-md border border-border bg-background md:mx-4 md:mt-4">
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 z-10 h-1 bg-foreground/12"
        />
        {cover ? (
          <RemoteImage
            src={cover}
            alt={project.title}
            fill
            unoptimized
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-surface via-[#161616] to-background" />
        )}
      </div>

      <div className="relative m-2.5 mt-2 flex flex-1 flex-col overflow-visible rounded-md border border-border bg-background/80 p-3 md:m-3 md:mt-2.5 md:p-4">
        <div className="font-mono text-sm uppercase tracking-[0.14em] text-accent md:text-base">
          <span className="tabular-nums">{project.id}</span>
        </div>

        <h3 className="mt-2 min-w-0 break-words font-display text-[clamp(1.6rem,4vw,3.25rem)] font-extrabold uppercase leading-[0.95] tracking-tight transition-colors duration-300 group-hover:text-accent">
          {project.title}
        </h3>

        <div className="mt-1.5 flex items-center gap-3">
          {meta ? (
            <p className="min-w-0 flex-1 truncate font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted md:text-sm">
              {meta}
            </p>
          ) : null}
          <ProjectSkills
            skills={project.skills}
            size="sm"
            className="-mr-2 ml-auto shrink-0 text-foreground/70 transition-colors group-hover:text-foreground"
          />
        </div>

        <span className="pointer-events-none absolute bottom-3 right-3 font-mono text-base text-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:bottom-4 md:right-4 md:text-lg">
          →
        </span>
      </div>
    </Link>
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
