import { ProjectCard } from "@/components/ProjectCard";
import { projects } from "@/content/projects";

export function ProjectGrid() {
  return (
    <section className="mx-auto max-w-[1600px] px-5 pb-8 md:px-8 md:pb-10">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
        {projects.map((project, index) => (
          <ProjectCard
            key={project.slug}
            slug={project.slug}
            title={project.title}
            thumbnail={project.thumbnail}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}
