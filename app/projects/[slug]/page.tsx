import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectGallery, ProjectGalleryHero } from "@/components/ProjectGallery";
import { ProjectInfo } from "@/components/ProjectInfo";
import { ProjectVimeoHero } from "@/components/ProjectVimeoHero";
import { ProjectYoutubeHero } from "@/components/ProjectYoutubeHero";
import {
  getAdjacentProjects,
  getProjectBySlug,
  projectCategoryLabels,
  projects,
  type Project,
} from "@/content/projects";
import { site } from "@/content/site";
import { splitGalleryForDisplay } from "@/lib/gallery-layout";
import {
  galleryWithoutThumbnail,
  listGalleryHeroVideoFromDisk,
  listGalleryImagesFromDisk,
  resolveConfiguredHeroVideoUrl,
} from "@/lib/project-media";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

function projectShareDescription(project: Project) {
  const concept = project.sections.concept?.trim();
  if (concept) {
    const firstParagraph = concept.split(/\n\n+/)[0].replace(/\s+/g, " ").trim();
    return firstParagraph.length > 160
      ? `${firstParagraph.slice(0, 157).trimEnd()}…`
      : firstParagraph;
  }

  const bits = [project.sections.role, project.client, project.event, project.year]
    .filter(Boolean)
    .join(" · ");

  return bits || `${project.title} by ${site.name}`;
}

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return { title: "Project not found" };
  }

  const title = project.title;
  const description = projectShareDescription(project);
  const url = `/projects/${project.slug}`;
  const image = project.thumbnail
    ? {
        url: project.thumbnail,
        alt: project.title,
      }
    : {
        url: site.logo,
        alt: site.name,
      };

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: site.name,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const { prev, next } = getAdjacentProjects(slug);
  const heroVideo = listGalleryHeroVideoFromDisk(project);
  const configuredHeroVideo = resolveConfiguredHeroVideoUrl(project.heroVideoUrl);
  const localHeroVideo = configuredHeroVideo ?? heroVideo;
  const hasLocalHeroVideo = Boolean(localHeroVideo);
  const allGalleryImages = listGalleryImagesFromDisk(project);
  const hasEmbedHero = Boolean(project.heroVimeoId || project.heroYoutubeId);
  const { hero, rest } = splitGalleryForDisplay(
    allGalleryImages,
    project.galleryLayout,
  );
  const heroRow =
    hasEmbedHero || hasLocalHeroVideo
      ? null
      : hero ??
        (project.thumbnail
          ? { columns: 1 as const, items: [project.thumbnail] }
          : null);
  const galleryRest = (() => {
    const images = hasEmbedHero || hasLocalHeroVideo ? allGalleryImages : rest;
    if (!project.thumbnail) return images;
    return galleryWithoutThumbnail(images, project.thumbnail);
  })();

  const subtitle = [project.client, project.event].filter(Boolean).join(" · ");

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
      {subtitle ? (
        <p className="mt-4 max-w-2xl text-sm uppercase tracking-[0.18em] text-muted md:text-base">
          {subtitle}
        </p>
      ) : null}
      {project.sections.role ? (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/80 md:text-base">
          {project.sections.role}
        </p>
      ) : null}

      {project.heroVimeoId ? (
        <ProjectVimeoHero
          title={project.title}
          vimeoId={project.heroVimeoId}
        />
      ) : project.heroYoutubeId ? (
        <ProjectYoutubeHero
          title={project.title}
          youtubeId={project.heroYoutubeId}
        />
      ) : heroRow ? (
        <ProjectGalleryHero
          title={project.title}
          row={heroRow}
          layout={project.galleryLayout}
        />
      ) : localHeroVideo ? (
        <ProjectGalleryHero
          title={project.title}
          row={{
            columns: 1,
            items: [localHeroVideo],
          }}
          layout={project.galleryLayout}
        />
      ) : null}

      <ProjectInfo
        sections={project.sections}
        externalUrl={project.externalUrl}
      />

      <ProjectGallery
        title={project.title}
        images={galleryRest}
        layout={project.galleryLayout}
        variant="continuation"
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
