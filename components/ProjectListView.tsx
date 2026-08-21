"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ProjectSkills } from "@/components/ProjectSkills";
import type { Project } from "@/content/projects";

const listVariants = {
  show: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1 as const,
    },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.56,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    x: 6,
    transition: {
      duration: 0.32,
      ease: [0.4, 0, 1, 1] as const,
    },
  },
};

type ProjectListViewProps = {
  projects: Project[];
  listKey: string;
  reduceMotion: boolean;
};

export function ProjectListView({
  projects,
  listKey,
  reduceMotion,
}: ProjectListViewProps) {
  return (
    <div className="relative min-h-[12rem]">
      <AnimatePresence mode="wait">
        <motion.ul
          key={listKey}
          className="border border-border bg-background/70 backdrop-blur-[2px]"
          variants={reduceMotion ? undefined : listVariants}
          initial={reduceMotion ? false : "hidden"}
          animate="show"
          exit="exit"
        >
          {projects.map((project, index) => (
            <ProjectRow
              key={project.slug}
              project={project}
              index={index}
              reduceMotion={reduceMotion}
            />
          ))}
        </motion.ul>
      </AnimatePresence>

      {projects.length === 0 ? (
        <p className="border border-border bg-background/80 py-16 text-center font-mono text-xs uppercase tracking-[0.28em] text-muted">
          no_signal // empty set
        </p>
      ) : null}
    </div>
  );
}

function ProjectRow({
  project,
  index,
  reduceMotion,
}: {
  project: Project;
  index: number;
  reduceMotion: boolean;
}) {
  const meta = [project.client, project.event].filter(Boolean).join(" / ");

  return (
    <motion.li
      variants={reduceMotion ? undefined : rowVariants}
      className={index > 0 ? "border-t border-border" : undefined}
    >
      <Link
        href={`/projects/${project.slug}`}
        data-ui-tone="tonic"
        className="group relative grid grid-cols-[auto_1fr_auto] items-start gap-x-4 gap-y-3 px-4 py-5 outline-none md:grid-cols-[5.5rem_minmax(0,1fr)_7rem_auto] md:items-center md:gap-x-8 md:px-5 md:py-6"
      >
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-0 bg-accent transition-[width] duration-300 ease-out group-hover:w-1 group-focus-visible:w-1"
        />

        <span className="font-mono text-[0.7rem] tabular-nums tracking-[0.14em] text-accent md:text-xs">
          [{project.id}]
        </span>

        <div className="col-span-2 min-w-0 md:col-span-1">
          <h2 className="font-display text-[clamp(1.25rem,3vw,2.15rem)] font-extrabold uppercase leading-[0.92] tracking-tight transition-colors duration-200 group-hover:text-accent">
            <span
              aria-hidden
              className="mr-2 hidden font-mono text-sm font-normal text-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:inline"
            >
              &gt;
            </span>
            {project.title}
          </h2>
          {meta ? (
            <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted md:text-[0.7rem]">
              {meta}
            </p>
          ) : null}
          {project.sections.role ? (
            <p className="mt-2 max-w-2xl text-sm leading-snug text-foreground/60">
              {project.sections.role}
            </p>
          ) : null}
        </div>

        <span className="hidden font-mono text-xs tabular-nums tracking-[0.2em] text-foreground/75 md:block md:text-right">
          {project.year}
        </span>

        <div className="flex items-center justify-end gap-4 md:justify-self-end">
          <span className="font-mono text-[0.65rem] tabular-nums tracking-[0.18em] text-foreground/75 md:hidden">
            {project.year}
          </span>
          <ProjectSkills
            skills={project.skills}
            className="text-foreground/65 transition-colors group-hover:text-foreground"
          />
          <span
            aria-hidden
            className="font-mono text-xs text-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          >
            ↗
          </span>
        </div>
      </Link>
    </motion.li>
  );
}
