import { RemoteImage } from "@/components/RemoteImage";
import Link from "next/link";
import { site } from "@/content/site";

const navLinks = [
  { label: "Work", href: "/" },
  { label: "About", href: "/about" },
];

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6.5 8.5h3v11h-3v-11zm1.5-4.5a1.75 1.75 0 110 3.5 1.75 1.75 0 010-3.5zM10 8.5h2.9v1.5h.04c.4-.75 1.4-1.55 2.88-1.55 3.08 0 3.65 2.03 3.65 4.67v6.38h-3v-5.66c0-1.35-.03-3.08-1.88-3.08-1.88 0-2.17 1.47-2.17 2.98v5.76H10v-11z" />
    </svg>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-4 md:px-8 md:py-5">
        <Link href="/" className="group flex items-center gap-3">
          <span className="relative block h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-border transition-all group-hover:ring-accent">
            <RemoteImage
              src={site.logo}
              alt={site.name}
              fill
              sizes="36px"
              className="object-cover"
              priority
            />
          </span>
          <span className="hidden font-display text-sm font-bold uppercase tracking-[0.15em] sm:inline">
            {site.name.split(" ")[0]}
          </span>
        </Link>

        <nav className="flex items-center gap-5 md:gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-display text-xs font-bold uppercase tracking-[0.2em] transition-colors hover:text-accent md:text-sm"
            >
              {link.label}
            </Link>
          ))}
          <span className="hidden h-4 w-px bg-border sm:block" />
          <a
            href={site.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="transition-colors hover:text-accent"
          >
            <InstagramIcon />
          </a>
          <a
            href={site.social.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="transition-colors hover:text-accent"
          >
            <LinkedinIcon />
          </a>
        </nav>
      </div>
    </header>
  );
}
