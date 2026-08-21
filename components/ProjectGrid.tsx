"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type MotionValue,
} from "framer-motion";
import { RemoteImage } from "@/components/RemoteImage";
import { ProjectListView } from "@/components/ProjectListView";
import { ProjectSkills } from "@/components/ProjectSkills";
import {
  projectCategories,
  projectCategoryLabels,
  projects,
  type Project,
  type ProjectCategory,
} from "@/content/projects";

type CategoryFilter = "all" | ProjectCategory;
type ViewMode = "grid" | "list";

const MAX_TILT = 1;
const INFLUENCE_RADIUS = 1.85;

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.32,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: {
      duration: 0.18,
      ease: [0.4, 0, 1, 1] as const,
    },
  },
};

const tiltSpring = { stiffness: 180, damping: 24, mass: 0.55 };

function sortByDateDesc<T extends { id: string }>(list: T[]) {
  return [...list].sort((a, b) => Number(b.id) - Number(a.id));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function ProjectGrid() {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [view, setView] = useState<ViewMode>("grid");
  const reduceMotion = useReducedMotion();
  const mouseX = useMotionValue(-1);
  const mouseY = useMotionValue(-1);

  const filteredProjects = useMemo(() => {
    const list =
      category === "all"
        ? projects
        : projects.filter((project) => project.category === category);
    return sortByDateDesc(list);
  }, [category]);

  useEffect(() => {
    if (reduceMotion || view !== "grid") return;

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      mouseX.set(event.clientX);
      mouseY.set(event.clientY);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [mouseX, mouseY, reduceMotion, view]);

  return (
    <section className="relative w-full pb-20 pt-6">
      <div className="relative mx-auto max-w-[1600px] px-5 md:px-8">
      <div className="mb-8 border border-border bg-background/80 backdrop-blur-[2px] md:mb-10">
        <div className="flex flex-col gap-4 border-b border-border px-4 py-3 md:flex-row md:items-center md:justify-between md:gap-6 md:px-5">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-accent">
              // index
            </span>
            <p className="font-mono text-[0.7rem] tabular-nums tracking-wide text-muted">
              {String(filteredProjects.length).padStart(2, "0")}_
              {filteredProjects.length === 1 ? "PROJECT" : "PROJECTS"}
            </p>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-3 md:justify-end">
            <div
              role="group"
              aria-label="Filter projects by category"
              className="flex min-w-0 flex-wrap items-center gap-1.5"
            >
              <FilterButton
                active={category === "all"}
                onClick={() => setCategory("all")}
                label="ALL"
              />

              {projectCategories.map((value) => (
                <FilterButton
                  key={value}
                  active={category === value}
                  onClick={() => setCategory(value)}
                  label={projectCategoryLabels[value].toUpperCase()}
                />
              ))}
            </div>

            <span className="hidden h-5 w-px bg-border sm:block" aria-hidden />

            <div
              role="group"
              aria-label="Layout view"
              className="flex items-center gap-0.5 border border-border p-0.5"
            >
              <ViewIconButton
                active={view === "grid"}
                onClick={() => setView("grid")}
                label="Grid view"
              >
                <GridViewIcon />
              </ViewIconButton>
              <ViewIconButton
                active={view === "list"}
                onClick={() => setView("list")}
                label="List view"
              >
                <ListViewIcon />
              </ViewIconButton>
            </div>
          </div>
        </div>
      </div>

      {view === "list" ? (
        <div className="relative">
          <ProjectListView
            projects={filteredProjects}
            listKey={category}
            reduceMotion={Boolean(reduceMotion)}
          />
        </div>
      ) : (
        <div className="relative min-h-[12rem]" style={{ perspective: 1200 }}>
          <motion.div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            <AnimatePresence initial={false}>
              {filteredProjects.map((project, index) => (
                <ProjectCard
                  key={project.slug}
                  project={project}
                  priority={index < 6}
                  reduceMotion={Boolean(reduceMotion)}
                  mouseX={mouseX}
                  mouseY={mouseY}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredProjects.length === 0 ? (
            <p className="border border-border bg-background/80 py-16 text-center font-mono text-xs uppercase tracking-[0.28em] text-muted">
              no_signal // empty set
            </p>
          ) : null}
        </div>
      )}
      </div>
    </section>
  );
}

function ProjectCard({
  project,
  priority = false,
  reduceMotion,
  mouseX,
  mouseY,
}: {
  project: Project;
  priority?: boolean;
  reduceMotion: boolean;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rotateXRaw = useMotionValue(0);
  const rotateYRaw = useMotionValue(0);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const glareOpacity = useMotionValue(0);

  const rotateX = useSpring(rotateXRaw, tiltSpring);
  const rotateY = useSpring(rotateYRaw, tiltSpring);
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.18), transparent 55%)`;

  const meta = [project.client, project.event].filter(Boolean).join(" · ");

  useEffect(() => {
    if (reduceMotion) return;

    let frame = 0;

    const updateTilt = () => {
      frame = 0;
      const node = cardRef.current;
      if (!node) return;

      const mx = mouseX.get();
      const my = mouseY.get();
      if (mx < 0 || my < 0) {
        rotateXRaw.set(0);
        rotateYRaw.set(0);
        glareOpacity.set(0);
        return;
      }

      const rect = node.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = mx - centerX;
      const dy = my - centerY;
      const distance = Math.hypot(dx, dy);
      const radius = Math.max(rect.width, rect.height) * INFLUENCE_RADIUS;
      const influence = clamp(1 - distance / radius, 0, 1);

      if (influence <= 0) {
        rotateXRaw.set(0);
        rotateYRaw.set(0);
        glareOpacity.set(0);
        return;
      }

      const nx = clamp(dx / (rect.width / 2), -1.6, 1.6);
      const ny = clamp(dy / (rect.height / 2), -1.6, 1.6);

      rotateYRaw.set(nx * MAX_TILT * influence);
      rotateXRaw.set(-ny * MAX_TILT * influence);
      glareX.set(50 + nx * 35);
      glareY.set(50 + ny * 35);
      glareOpacity.set(influence * 0.7);
    };

    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(updateTilt);
    };

    const unsubX = mouseX.on("change", schedule);
    const unsubY = mouseY.on("change", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    schedule();

    return () => {
      unsubX();
      unsubY();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [
    glareOpacity,
    glareX,
    glareY,
    mouseX,
    mouseY,
    reduceMotion,
    rotateXRaw,
    rotateYRaw,
  ]);

  return (
    <motion.div
      ref={cardRef}
      layout={false}
      variants={reduceMotion ? undefined : cardVariants}
      initial={reduceMotion ? false : "hidden"}
      animate="show"
      exit="exit"
      className="origin-center will-change-transform"
      style={
        reduceMotion
          ? undefined
          : {
              rotateX,
              rotateY,
              transformStyle: "preserve-3d",
              transformPerspective: 900,
            }
      }
    >
      <Link
        href={`/projects/${project.slug}`}
        data-ui-tone="tonic"
        className="group relative flex h-full flex-col rounded-lg border border-border bg-surface outline-none transition-colors duration-300 hover:border-accent/60 focus-visible:border-accent"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Media window */}
        <div className="relative mx-2 mt-2 aspect-[16/10] overflow-hidden rounded-md border border-border bg-background">
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 z-10 h-1 bg-foreground/12"
          />
          {project.thumbnail ? (
            <RemoteImage
              src={project.thumbnail}
              alt={project.title}
              fill
              priority={priority}
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-surface via-[#161616] to-background" />
          )}

          {!reduceMotion ? (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 mix-blend-soft-light"
              style={{ background: glareBackground, opacity: glareOpacity }}
            />
          ) : null}
        </div>

        {/* Label block */}
        <div
          className="relative m-2 mt-1.5 flex flex-1 flex-col overflow-visible rounded-md border border-border bg-background/80 p-2.5 md:p-3"
          style={{ transform: "translateZ(18px)" }}
        >
          <div className="flex items-baseline justify-between gap-3 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-muted">
            <span className="tabular-nums text-accent">{project.id}</span>
            <span className="tabular-nums">{project.year}</span>
          </div>

          <div
            aria-hidden
            className="mt-1.5 h-px w-full bg-[repeating-linear-gradient(90deg,var(--border)_0_4px,transparent_4px_8px)]"
          />

          <h2 className="mt-2 font-display text-[clamp(1.05rem,2.2vw,1.45rem)] font-extrabold uppercase leading-[0.95] tracking-tight transition-colors duration-300 group-hover:text-accent">
            {project.title}
          </h2>

          {meta ? (
            <p className="mt-1.5 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted">
              {meta}
            </p>
          ) : null}

          <div className="mt-auto flex items-end justify-between gap-3 pt-2.5">
            <ProjectSkills
              skills={project.skills}
              className="text-foreground/70 transition-colors group-hover:text-foreground"
            />
            <span className="font-mono text-sm text-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function FilterButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      data-ui-tone="vapor"
      aria-pressed={active}
      onClick={onClick}
      className={`border px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.16em] transition-colors ${
        active
          ? "border-accent bg-accent text-background"
          : "border-border bg-transparent text-foreground/75 hover:border-foreground/40 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function ViewIconButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      data-ui-tone="classic"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center transition-colors ${
        active
          ? "bg-accent text-background"
          : "bg-transparent text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function GridViewIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
    >
      <rect x="1" y="1" width="6" height="6" />
      <rect x="9" y="1" width="6" height="6" />
      <rect x="1" y="9" width="6" height="6" />
      <rect x="9" y="9" width="6" height="6" />
    </svg>
  );
}

function ListViewIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
    >
      <rect x="1" y="2" width="3" height="3" />
      <rect x="6" y="2.75" width="9" height="1.5" />
      <rect x="1" y="6.5" width="3" height="3" />
      <rect x="6" y="7.25" width="9" height="1.5" />
      <rect x="1" y="11" width="3" height="3" />
      <rect x="6" y="11.75" width="9" height="1.5" />
    </svg>
  );
}
