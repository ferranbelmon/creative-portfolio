"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { RemoteImage } from "@/components/RemoteImage";
import { ProjectListView } from "@/components/ProjectListView";
import { ProjectSkills } from "@/components/ProjectSkills";
import {
  getVisibleProjects,
  projectCategories,
  projectCategoryLabels,
  type Project,
  type ProjectCategory,
} from "@/content/projects";

type CategoryFilter = "all" | ProjectCategory;
type ViewMode = "grid" | "list";

const gridVariants = {
  show: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.025,
      staggerDirection: -1 as const,
    },
  },
};

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

function sortByDateDesc<T extends { id: string }>(list: T[]) {
  return [...list].sort((a, b) => Number(b.id) - Number(a.id));
}

export function ProjectGrid() {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [view, setView] = useState<ViewMode>("grid");
  const reduceMotion = useReducedMotion();

  const filteredProjects = useMemo(() => {
    const list =
      category === "all"
        ? getVisibleProjects()
        : getVisibleProjects().filter(
            (project) => project.category === category,
          );
    return sortByDateDesc(list);
  }, [category]);

  return (
    <section className="relative w-full pb-20 pt-6">
      <div className="relative mx-auto max-w-[1600px] px-5 md:px-8">
        <div className="mb-8 md:mb-10">
          <div className="md:hidden">
            <div className="flex flex-nowrap items-center gap-1.5">
              <div
                role="group"
                aria-label="Filter projects by category"
                className="flex min-w-0 flex-1 flex-nowrap items-center gap-1"
              >
                <FilterButton
                  active={category === "all"}
                  onClick={() => setCategory("all")}
                  label="ALL"
                  compact
                />
                {projectCategories.map((value) => (
                  <FilterButton
                    key={value}
                    active={category === value}
                    onClick={() => setCategory(value)}
                    label={
                      value === "artistic-practice" ? "ARTISTIC" : "COMMISSIONS"
                    }
                    compact
                  />
                ))}
              </div>
              <div className="shrink-0">
                <ViewToggle view={view} onChange={setView} compact />
              </div>
            </div>
            <p className="mt-3 font-mono text-[0.65rem] tabular-nums tracking-wide text-muted">
              {String(filteredProjects.length).padStart(2, "0")}_
              {filteredProjects.length === 1 ? "PROJECT" : "PROJECTS"}
            </p>
          </div>

          <div className="hidden border border-border bg-background/80 backdrop-blur-[2px] md:block">
            <div className="flex items-center justify-between gap-6 px-5 py-3">
              <p className="font-mono text-[0.7rem] tabular-nums tracking-wide text-muted">
                {String(filteredProjects.length).padStart(2, "0")}_
                {filteredProjects.length === 1 ? "PROJECT" : "PROJECTS"}
              </p>

              <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
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
                <span className="h-5 w-px bg-border" aria-hidden />
                <ViewToggle view={view} onChange={setView} />
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
          <div className="relative min-h-[12rem]">
            <AnimatePresence mode="wait">
              <motion.div
                key={category}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5"
                variants={reduceMotion ? undefined : gridVariants}
                initial={reduceMotion ? false : "hidden"}
                animate="show"
                exit="exit"
              >
                {filteredProjects.map((project, index) => (
                  <ProjectCard
                    key={project.slug}
                    project={project}
                    priority={index < 6}
                    reduceMotion={Boolean(reduceMotion)}
                  />
                ))}
              </motion.div>
            </AnimatePresence>

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
}: {
  project: Project;
  priority?: boolean;
  reduceMotion: boolean;
}) {
  const meta = [project.client, project.event].filter(Boolean).join(" · ");

  return (
    <motion.div
      variants={reduceMotion ? undefined : cardVariants}
      className="origin-center"
    >
      <Link
        href={`/projects/${project.slug}`}
        data-ui-tone="tonic"
        className="group relative flex h-full flex-col rounded-lg border border-border bg-surface outline-none transition-colors duration-300 hover:border-accent/60 hover:outline hover:outline-1 hover:outline-offset-0 hover:outline-accent/60 focus-visible:border-accent"
      >
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
              unoptimized
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-surface via-[#161616] to-background" />
          )}
        </div>

        <div className="relative m-2 mt-1.5 flex flex-1 flex-col overflow-visible rounded-md border border-border bg-background/80 p-2.5 md:p-3">
          <div className="flex items-baseline justify-between gap-3 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-muted md:text-sm md:tracking-[0.14em]">
            <span className="tabular-nums text-accent">{project.id}</span>
            <span className="tabular-nums">{project.year}</span>
          </div>

          <h2 className="mt-2 min-w-0 break-words font-display text-[clamp(1.05rem,2.2vw,1.45rem)] font-extrabold uppercase leading-[0.95] tracking-tight transition-colors duration-300 group-hover:text-accent">
            {project.title}
          </h2>

          {meta ? (
            <p className="mt-1.5 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted">
              {meta}
            </p>
          ) : null}

          <div className="mt-auto flex items-end justify-end gap-3 pt-2.5 md:justify-between">
            <ProjectSkills
              skills={project.skills}
              size="sm"
              className="text-foreground/70 transition-colors group-hover:text-foreground"
            />
            <span className="hidden font-mono text-sm text-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:inline">
              →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function ViewToggle({
  view,
  onChange,
  compact = false,
}: {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
  compact?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label="Layout view"
      className={
        compact
          ? "flex items-center gap-0.5 rounded-full border border-foreground/20 bg-foreground/[0.04] p-0.5"
          : "flex items-center gap-0.5 border border-border p-0.5"
      }
    >
      <ViewIconButton
        active={view === "grid"}
        onClick={() => onChange("grid")}
        label="Grid view"
        round={compact}
      >
        <GridViewIcon />
      </ViewIconButton>
      <ViewIconButton
        active={view === "list"}
        onClick={() => onChange("list")}
        label="List view"
        round={compact}
      >
        <ListViewIcon />
      </ViewIconButton>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  label,
  compact = false,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      data-ui-tone="vapor"
      aria-pressed={active}
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-md border-2 font-mono uppercase transition-colors ${
        compact
          ? "px-1.5 py-0.5 text-[0.52rem] tracking-[0.08em]"
          : "px-3 py-1.5 text-[0.68rem] tracking-[0.16em]"
      } ${
        active
          ? "border-accent bg-accent text-black"
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
  round = false,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
  round?: boolean;
}) {
  return (
    <button
      type="button"
      data-ui-tone="classic"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
      className={`flex items-center justify-center transition-colors ${
        round ? "h-7 w-7 rounded-full" : "h-8 w-8"
      } ${
        active
          ? "bg-accent text-black"
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
