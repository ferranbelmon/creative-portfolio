type ProjectVimeoHeroProps = {
  title: string;
  vimeoId: string;
};

export function ProjectVimeoHero({ title, vimeoId }: ProjectVimeoHeroProps) {
  const src = `https://player.vimeo.com/video/${vimeoId}?badge=0&autopause=0&player_id=0&app_id=58479`;

  return (
    <section className="mt-10 md:mt-12">
      <div className="relative w-full overflow-hidden bg-surface aspect-video">
        <iframe
          src={src}
          title={`${title} — video`}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
          allowFullScreen
        />
      </div>
    </section>
  );
}
