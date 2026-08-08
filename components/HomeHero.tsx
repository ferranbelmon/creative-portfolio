import { site } from "@/content/site";

export function HomeHero() {
  const [firstName, ...rest] = site.name.split(" ");

  return (
    <section className="border-b border-border px-5 py-12 md:px-8 md:py-20">
      <div className="mx-auto max-w-[1600px]">
        <p className="mb-6 text-xs font-bold uppercase tracking-[0.35em] text-accent">
          Portfolio
        </p>
        <h1 className="font-display text-[clamp(3rem,12vw,9rem)] font-extrabold uppercase leading-[0.85] tracking-tight">
          {firstName}
          <br />
          {rest.join(" ")}
        </h1>
        <p className="mt-6 max-w-xl text-base text-muted md:mt-8 md:text-lg">
          {site.title}
        </p>
      </div>
    </section>
  );
}
