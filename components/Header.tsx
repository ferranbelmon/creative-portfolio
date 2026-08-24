"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { site } from "@/content/site";
import {
  markScrollToSelectedWork,
  scrollToSelectedWork,
} from "@/lib/scroll-selected-work";

const navLinkClass =
  "font-display text-xs font-bold uppercase tracking-[0.2em] transition-opacity hover:opacity-70 md:text-sm";

const MORSE_MARK = "..-. -...";

function MorseMark() {
  return (
    <span
      aria-hidden
      className="font-mark inline-flex text-[0.8rem] font-black leading-none tracking-[0.06em] text-white light:text-foreground md:text-base"
    >
      {MORSE_MARK.split("").map((char, index) => (
        <span
          key={`${char}-${index}`}
          className="morse-wave-char"
          style={{ animationDelay: `${index * 0.06}s` }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [homePastSelected, setHomePastSelected] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/") {
      setHomePastSelected(false);
      return;
    }

    function sync() {
      const section = document.getElementById("selected-work");
      if (!section) {
        setHomePastSelected(false);
        return;
      }
      setHomePastSelected(
        section.getBoundingClientRect().top <= window.innerHeight * 0.35,
      );
    }

    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [pathname]);

  useEffect(() => {
    if (open) {
      setMenuMounted(true);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setMenuVisible(true));
      });
      return () => cancelAnimationFrame(id);
    }

    setMenuVisible(false);
    const timeout = window.setTimeout(() => setMenuMounted(false), 420);
    return () => window.clearTimeout(timeout);
  }, [open]);

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

  const isHome = pathname === "/";
  const solidChrome = !isHome || homePastSelected;

  function goHomeTop(event: React.MouseEvent<HTMLAnchorElement>) {
    if (!isHome) return;

    event.preventDefault();
    if (window.location.hash) {
      window.history.replaceState(null, "", "/");
    }
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }

  return (
    <header
      className={`pointer-events-none fixed top-0 right-0 left-0 z-50 transition-[background-color,backdrop-filter] duration-300 ${
        solidChrome
          ? "bg-background/70 backdrop-blur-md"
          : "bg-transparent"
      }`}
    >      <div className="pointer-events-auto mx-auto flex max-w-[1600px] items-center justify-between px-5 py-4 md:px-8 md:py-5">
        <Link
          href="/"
          aria-label={site.name}
          onClick={goHomeTop}
          className="group mix-blend-difference light:mix-blend-normal"
        >
          <span className="flex items-center justify-center rounded-2xl border-2 border-white/50 px-3 py-2 transition-colors group-hover:border-white light:border-foreground/40 light:group-hover:border-foreground">
            <MorseMark />
          </span>
        </Link>

        <nav className="hidden items-center gap-5 text-white mix-blend-difference light:text-foreground light:mix-blend-normal md:flex md:gap-8">
          <Link href="/work" data-ui-tone="classic" className={navLinkClass}>
            Work
          </Link>
          <Link href="/about" data-ui-tone="classic" className={navLinkClass}>
            About
          </Link>
          <Link href="/contact" data-ui-tone="classic" className={navLinkClass}>
            Contact
          </Link>
          <span className="h-4 w-px bg-white/35 light:bg-foreground/30" />
          <ThemeToggle />
        </nav>

        <div ref={menuRef} className="relative md:hidden">
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center mix-blend-difference"
          >
            <span
              aria-hidden
              className="block h-3 w-3 rounded-full bg-white transition-colors"
            />
          </button>

          {menuMounted ? (
            <div
              id="mobile-nav"
              role="navigation"
              className={`mobile-nav-popup absolute top-[calc(100%+0.75rem)] right-0 z-50 min-w-[13.5rem] border border-white/20 bg-background/55 px-4 py-4 text-right text-foreground shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl light:border-foreground/15 ${
                menuVisible ? "is-open" : ""
              }`}
            >
              <ul className="flex flex-col items-end gap-3.5">
                <li>
                  <Link
                    href="/#selected-work-heading"
                    data-ui-tone="classic"
                    className={`${navLinkClass} whitespace-nowrap`}
                    onClick={(event) => {
                      setOpen(false);
                      markScrollToSelectedWork();
                      if (pathname !== "/") return;
                      event.preventDefault();
                      scrollToSelectedWork();
                    }}
                  >
                    Selected work
                  </Link>
                </li>
                <li>
                  <Link
                    href="/work"
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
                  <Link
                    href="/contact"
                    data-ui-tone="classic"
                    className={navLinkClass}
                    onClick={() => setOpen(false)}
                  >
                    Contact
                  </Link>
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
