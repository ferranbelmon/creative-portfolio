import Link from "next/link";
import { RemoteImage } from "@/components/RemoteImage";
import { projects } from "@/content/projects";

export function ProjectGrid() {
  return (
    <section className="mx-auto max-w-[1600px] px-5 pb-4 md:px-8">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, index) => (
          <Link
            key={project.slug}
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
                <span className="font-display text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted">
                  {project.year}
                </span>
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
        ))}
      </div>
    </section>
  );
}
