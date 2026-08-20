type ProjectYoutubeHeroProps = {
  title: string;
  youtubeId: string;
};

export function ProjectYoutubeHero({ title, youtubeId }: ProjectYoutubeHeroProps) {
  const src = `https://www.youtube.com/embed/${youtubeId}?rel=0`;

  return (
    <section className="mt-10 md:mt-12">
      <div className="relative w-full overflow-hidden bg-surface aspect-video">
        <iframe
          src={src}
          title={`${title} — video`}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </section>
  );
}
