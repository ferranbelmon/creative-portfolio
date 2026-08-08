import { site } from "@/content/site";

export function Footer() {
  return (
    <footer className="mt-8 border-t border-border px-5 py-8 md:px-8">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="font-display text-xs font-bold uppercase tracking-[0.3em] text-muted">
          {site.location}
        </p>
        <a
          href={`mailto:${site.email}`}
          className="font-display text-xs font-bold uppercase tracking-[0.2em] transition-colors hover:text-accent"
        >
          Get in touch
        </a>
      </div>
    </footer>
  );
}
