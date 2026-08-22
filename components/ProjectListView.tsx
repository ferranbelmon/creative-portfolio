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
        className="group relative flex flex-col gap-1.5 px-3 py-3.5 outline-none md:grid md:grid-cols-[5.5rem_minmax(0,1fr)_5.25rem_7.5rem] md:items-center md:gap-x-8 md:px-5 md:py-6"
      >
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-0 bg-accent transition-[width] duration-300 ease-out group-hover:w-1 group-focus-visible:w-1"
        />

        <span className="hidden font-mono text-xs tabular-nums tracking-[0.14em] text-accent md:inline">
          [{project.id}]
        </span>

        <div className="min-w-0">
          <h2 className="line-clamp-2 text-left font-display text-[0.92rem] font-extrabold uppercase leading-[1.08] tracking-tight transition-colors duration-200 group-hover:text-accent md:line-clamp-none md:text-[clamp(1.25rem,3vw,2.15rem)] md:leading-[0.92]">
            <span
              aria-hidden
              className="mr-2 hidden font-mono text-sm font-normal text-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:inline"
            >
              &gt;
            </span>
            {project.title}
          </h2>
          {meta ? (
            <p className="mt-2 hidden font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted md:block">
              {meta}
            </p>
          ) : null}
          {project.sections.role ? (
            <p className="mt-2 hidden max-w-2xl text-sm leading-snug text-foreground/60 md:block">
              {project.sections.role}
            </p>
          ) : null}
        </div>

        <span className="hidden font-mono text-sm tabular-nums tracking-[0.14em] text-foreground/80 md:block md:w-full md:text-right">
          {project.year}
        </span>

        <div className="flex items-center justify-between gap-3 md:w-full md:justify-end md:justify-self-end">
          <p className="font-mono text-[0.58rem] tabular-nums tracking-[0.14em] text-muted md:hidden">
            <span className="text-accent">[{project.id}]</span>
            <span className="mx-1.5 text-border">/</span>
            <span className="text-foreground/80">{project.year}</span>
          </p>
          <ProjectSkills
            skills={project.skills}
            size="xs"
            className="shrink-0 justify-end text-foreground/65 transition-colors group-hover:text-foreground md:hidden"
          />
          <div className="hidden items-center gap-4 md:flex">
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
        </div>
      </Link>
    </motion.li>
  );
}
