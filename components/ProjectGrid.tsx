"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { RemoteImage } from "@/components/RemoteImage";
import {
  projectCategories,
  projectCategoryLabels,
  projects,
  type Project,
  type ProjectCategory,
} from "@/content/projects";

type CategoryFilter = "all" | ProjectCategory;

const MAX_TILT = 7;

const gridVariants = {
  show: {
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.02,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1 as const,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    scale: 0.72,
  },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.38,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.72,
    transition: {
      duration: 0.28,
      ease: [0.4, 0, 1, 1] as const,
    },
  },
};

function sortByDateDesc<T extends { id: string }>(list: T[]) {
  return [...list].sort((a, b) => Number(b.id) - Number(a.id));
}

export function ProjectGrid() {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const reduceMotion = useReducedMotion();

  const filteredProjects = useMemo(() => {
    const list =
      category === "all"
        ? projects
        : projects.filter((project) => project.category === category);
    return sortByDateDesc(list);
  }, [category]);

  return (
    <section className="mx-auto max-w-[1600px] px-5 pb-4 pt-6 md:px-8 md:pt-8">
      <div className="mb-8 rounded-2xl border border-border/70 bg-surface/70 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] md:mb-10 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
          <div className="shrink-0 md:w-36">
            <p className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-muted">
              Filter
            </p>
            <p className="mt-1.5 text-sm text-foreground/75">
              {filteredProjects.length}{" "}
              {filteredProjects.length === 1 ? "project" : "projects"}
            </p>
          </div>

          <div
            className="hidden h-12 w-px shrink-0 bg-border/80 md:block"
            aria-hidden
          />
          <div className="h-px w-full bg-border/70 md:hidden" aria-hidden />

          <div
            role="group"
            aria-label="Filter projects by category"
            className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
          >
            <FilterButton
              active={category === "all"}
              onClick={() => setCategory("all")}
              label="All"
            />

            <span
              className="mx-1 hidden h-5 w-px bg-border/80 sm:block"
              aria-hidden
            />

            {projectCategories.map((value) => (
              <FilterButton
                key={value}
                active={category === value}
                onClick={() => setCategory(value)}
                label={projectCategoryLabels[value]}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Tipology filter will plug in here later (Mapping, Instalación, etc.) */}

      <div className="relative min-h-[12rem]" style={{ perspective: 1000 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={category}
            className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
            variants={reduceMotion ? undefined : gridVariants}
            initial={reduceMotion ? false : "hidden"}
            animate="show"
            exit="exit"
          >
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.slug}
                project={project}
                reduceMotion={Boolean(reduceMotion)}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {filteredProjects.length === 0 ? (
          <p className="py-16 text-center text-sm uppercase tracking-[0.2em] text-muted">
            No projects in this category
          </p>
        ) : null}
      </div>
    </section>
  );
}

function ProjectCard({
  project,
  reduceMotion,
}: {
  project: Project;
  reduceMotion: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const normalizedX = useMotionValue(0);
  const normalizedY = useMotionValue(0);

  const spring = { stiffness: 220, damping: 22, mass: 0.6 };
  const rotateX = useSpring(
    useTransform(normalizedY, [-0.5, 0.5], [MAX_TILT, -MAX_TILT]),
    spring,
  );
  const rotateY = useSpring(
    useTransform(normalizedX, [-0.5, 0.5], [-MAX_TILT, MAX_TILT]),
    spring,
  );
  const glareX = useTransform(normalizedX, [-0.5, 0.5], [0, 100]);
  const glareY = useTransform(normalizedY, [-0.5, 0.5], [0, 100]);
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.18), transparent 55%)`;

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reduceMotion || event.pointerType !== "mouse") return;
    const node = cardRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    normalizedX.set((event.clientX - rect.left) / rect.width - 0.5);
    normalizedY.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  function handlePointerLeave() {
    normalizedX.set(0);
    normalizedY.set(0);
  }

  return (
    <motion.div
      ref={cardRef}
      variants={reduceMotion ? undefined : cardVariants}
      className="origin-center will-change-transform hover:z-10"
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
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <Link
        href={`/projects/${project.slug}`}
        className="group relative block aspect-square overflow-hidden bg-surface"
        style={{ transformStyle: "preserve-3d" }}
      >
        {project.thumbnail ? (
          <RemoteImage
            src={project.thumbnail}
            alt={project.title}
            fill
            className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:opacity-40"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-surface via-[#161616] to-background" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-90" />

        {!reduceMotion ? (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: glareBackground }}
          />
        ) : null}

        <div
          className="absolute inset-0 flex flex-col justify-between p-5 md:p-6"
          style={{ transform: "translateZ(24px)" }}
        >
          <div className="flex items-start justify-between gap-3">
            <span className="font-display text-xs font-bold text-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              {project.id}
            </span>
            <div className="text-right">
              <span className="block font-display text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted">
                {project.year}
              </span>
              <span className="mt-1 block text-[0.6rem] uppercase tracking-[0.16em] text-muted/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {projectCategoryLabels[project.category]}
              </span>
            </div>
          </div>

          <div>
            {project.event ? (
              <p className="mb-2 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {project.event}
              </p>
            ) : null}
            <h2 className="font-display text-2xl font-bold uppercase leading-none tracking-tight transition-all duration-300 group-hover:text-accent md:text-3xl lg:text-4xl">
              {project.title}
            </h2>
            <span className="mt-3 inline-block h-0.5 w-0 bg-accent transition-all duration-500 group-hover:w-full" />
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
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-xl border px-3.5 py-2 text-[0.8rem] font-medium tracking-wide transition-colors ${
        active
          ? "border-accent/55 bg-accent/10 text-accent"
          : "border-border/70 bg-background/40 text-muted hover:border-foreground/25 hover:bg-background/70 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
