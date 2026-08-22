"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { RemoteImage } from "@/components/RemoteImage";
import { ThemeToggle } from "@/components/ThemeToggle";
import { site } from "@/content/site";

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

const navLinkClass =
  "font-display text-xs font-bold uppercase tracking-[0.2em] transition-colors hover:text-accent md:text-sm";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    function onPointer(event: PointerEvent) {
      const root = menuRef.current;
      if (!root) return;
      if (event.target instanceof Node && root.contains(event.target)) return;
      setOpen(false);
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
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
            {site.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-5 md:flex md:gap-8">
          <Link href="/" data-ui-tone="classic" className={navLinkClass}>
            Work
          </Link>
          <Link href="/about" data-ui-tone="classic" className={navLinkClass}>
            About
          </Link>
          <span className="h-4 w-px bg-border" />
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
          <span className="h-4 w-px bg-border" />
          <ThemeToggle />
        </nav>

        <div ref={menuRef} className="relative md:hidden">
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center"
          >
            <span
              aria-hidden
              className={`block h-3 w-3 rounded-full transition-colors ${
                open ? "bg-accent" : "bg-foreground"
              }`}
            />
          </button>

          {open ? (
            <div
              id="mobile-nav"
              role="navigation"
              className="absolute top-[calc(100%+0.75rem)] right-0 z-50 min-w-[11.5rem] border border-border bg-background/95 px-4 py-4 shadow-sm backdrop-blur-md"
            >
              <ul className="flex flex-col gap-3.5">
                <li>
                  <Link
                    href="/"
                    data-ui-tone="classic"
                    className={navLinkClass}
                    onClick={() => setOpen(false)}
                  >
                    Work
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    data-ui-tone="classic"
                    className={navLinkClass}
                    onClick={() => setOpen(false)}
                  >
                    About
                  </Link>
                </li>
                <li>
                  <a
                    href={`mailto:${site.email}`}
                    data-ui-tone="classic"
                    className={navLinkClass}
                    onClick={() => setOpen(false)}
                  >
                    Contact
                  </a>
                </li>
                <li className="pt-1">
                  <ThemeToggle />
                </li>
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
