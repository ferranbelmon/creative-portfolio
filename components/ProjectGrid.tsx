"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { RemoteImage } from "@/components/RemoteImage";
import {
  projectCategories,
  projectCategoryLabels,
  projects,
  type ProjectCategory,
} from "@/content/projects";

type CategoryFilter = "all" | ProjectCategory;

const gridVariants = {
  show: {
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.04,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.04,
      staggerDirection: -1 as const,
    },
  },
};

const cardVariants = {
  hidden: {
    clipPath: "inset(0 0 100% 0)",
  },
  show: {
    clipPath: "inset(0 0 0% 0)",
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
  exit: {
    clipPath: "inset(0 0 100% 0)",
    transition: {
      duration: 0.32,
      ease: [0.4, 0, 1, 1] as const,
    },
  },
};

export function ProjectGrid() {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const reduceMotion = useReducedMotion();

  const filteredProjects = useMemo(() => {
    if (category === "all") return projects;
    return projects.filter((project) => project.category === category);
  }, [category]);

  return (
    <section className="mx-auto max-w-[1600px] px-5 pb-4 pt-6 md:px-8 md:pt-8">
      <div className="mb-8 border-b border-border pb-5 md:mb-10 md:pb-6">
        <div
          role="group"
          aria-label="Filter projects by category"
          className="flex flex-wrap items-center gap-2"
        >
          <FilterButton
            active={category === "all"}
            onClick={() => setCategory("all")}
            label="All"
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

        <p className="mt-4 text-xs tracking-wide text-muted">
          {filteredProjects.length}{" "}
          {filteredProjects.length === 1 ? "project" : "projects"}
        </p>
      </div>

      {/* Tipology filter will plug in here later (Mapping, Instalación, etc.) */}

      <div className="relative min-h-[12rem]">
        <AnimatePresence mode="wait">
          <motion.div
            key={category}
            className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
            variants={reduceMotion ? undefined : gridVariants}
            initial={reduceMotion ? false : "hidden"}
            animate="show"
            exit="exit"
          >
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.slug}
                variants={reduceMotion ? undefined : cardVariants}
                className="overflow-hidden"
              >
                <Link
                  href={`/projects/${project.slug}`}
                  className="group relative block aspect-square overflow-hidden bg-surface"
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

                  <div className="absolute inset-0 flex flex-col justify-between p-5 md:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-display text-xs font-bold text-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        {String(index + 1).padStart(2, "0")}
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
                      <p className="mb-2 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        {project.client}
                      </p>
                      <h2 className="font-display text-2xl font-bold uppercase leading-none tracking-tight transition-all duration-300 group-hover:text-accent md:text-3xl lg:text-4xl">
                        {project.title}
                      </h2>
                      <span className="mt-3 inline-block h-0.5 w-0 bg-accent transition-all duration-500 group-hover:w-full" />
                    </div>
                  </div>
                </Link>
              </motion.div>
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
      className={`border px-3 py-1.5 text-sm font-medium tracking-normal transition-colors ${
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-border text-muted hover:border-foreground/35 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
