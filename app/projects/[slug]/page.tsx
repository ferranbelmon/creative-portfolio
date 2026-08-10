import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectAccordion } from "@/components/ProjectAccordion";
import { ProjectFeaturedImage } from "@/components/ProjectFeaturedImage";
import { ProjectGallery } from "@/components/ProjectGallery";
import {
  getAdjacentProjects,
  getProjectBySlug,
  projectCategoryLabels,
  projects,
} from "@/content/projects";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return { title: "Project not found" };
  }

  return {
    title: `${project.title} — FB`,
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const { prev, next } = getAdjacentProjects(slug);
  const fullWidthGallery = project.galleryLayout?.columns === 1;
  // Prefer thumbnail beside project info; keep full-width galleries for the strip below.
  const featuredImage =
    project.thumbnail ??
    (fullWidthGallery ? undefined : project.images?.[0]);
  const galleryImages = (() => {
    const images = project.images ?? [];
    if (!images.length) return [];
    if (project.thumbnail) {
      return images.filter((src) => src !== project.thumbnail);
    }
    if (fullWidthGallery) return images;
    return images.length > 1 ? images.slice(1) : [];
  })();
  const showFeaturedBeside = Boolean(featuredImage);

  return (
    <main className="mx-auto max-w-[1600px] px-5 py-12 md:px-8 md:py-16">
      <p className="mb-4 font-display text-xs font-bold uppercase tracking-[0.3em] text-accent">
        {project.id}
        <span className="mx-3 text-border">/</span>
        {project.year}
        <span className="mx-3 text-border">/</span>
        {projectCategoryLabels[project.category]}
      </p>
      <h1 className="font-display max-w-5xl text-[clamp(2.5rem,7vw,5.5rem)] font-extrabold uppercase leading-[0.92] tracking-tight">
        {project.title}
      </h1>
      <p className="mt-4 max-w-2xl text-sm uppercase tracking-[0.18em] text-muted md:text-base">
        {project.client}
      </p>

      <section
        className={
          showFeaturedBeside
            ? "mt-10 grid items-start gap-10 lg:mt-12 lg:grid-cols-[minmax(0,1fr)_minmax(280px,34rem)] lg:gap-12 xl:gap-16"
            : "mt-10 max-w-3xl lg:mt-12"
        }
      >
        <ProjectAccordion sections={project.sections} />
        {showFeaturedBeside ? (
          <ProjectFeaturedImage title={project.title} src={featuredImage!} />
        ) : null}
      </section>

      <ProjectGallery
        title={project.title}
        images={galleryImages}
        layout={project.galleryLayout}
      />

      <section className="mt-16 border-t border-border pt-10 md:mt-20">
        <div className="grid gap-8 sm:grid-cols-2">
          {prev ? (
            <Link href={`/projects/${prev.slug}`} className="group">
              <p className="mb-3 font-display text-xs font-bold uppercase tracking-[0.25em] text-muted">
                ← Previous
              </p>
              <h2 className="font-display text-2xl font-bold uppercase transition-colors group-hover:text-accent md:text-3xl">
                {prev.title}
              </h2>
            </Link>
          ) : (
            <div />
          )}
          {next && (
            <Link
              href={`/projects/${next.slug}`}
              className="group sm:text-right"
            >
              <p className="mb-3 font-display text-xs font-bold uppercase tracking-[0.25em] text-muted">
                Next →
              </p>
              <h2 className="font-display text-2xl font-bold uppercase transition-colors group-hover:text-accent md:text-3xl">
                {next.title}
              </h2>
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
