"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

let transitionTimer: ReturnType<typeof setTimeout> | undefined;

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const apply = () => {
    root.classList.toggle("light", theme === "light");
    localStorage.setItem("theme", theme);
  };

  const doc = document as Document & {
    startViewTransition?: (update: () => void) => { finished: Promise<void> };
  };

  // Cross-fade the whole page so project text doesn't snap white↔black.
  if (typeof doc.startViewTransition === "function") {
    const transition = doc.startViewTransition(apply);
    void transition.finished.catch(() => undefined);
    return;
  }

  root.classList.add("theme-transition");
  apply();
  clearTimeout(transitionTimer);
  transitionTimer = setTimeout(() => {
    root.classList.remove("theme-transition");
  }, 600);
}

function SunIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5z" />
    </svg>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const next: Theme =
      stored === "light" || document.documentElement.classList.contains("light")
        ? "light"
        : "dark";
    setTheme(next);
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  const isLight = mounted && theme === "light";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isLight ? "Switch to night mode" : "Switch to day mode"}
      aria-pressed={isLight}
      className={`relative inline-flex h-7 w-[3.15rem] shrink-0 items-center rounded-full transition-colors duration-300 ${
        isLight
          ? "bg-accent text-black"
          : "bg-black text-white ring-1 ring-white/35"
      }`}
    >
      <span className="absolute left-[0.4rem] flex items-center justify-center">
        {isLight ? <SunIcon /> : <MoonIcon />}
      </span>
      <span
        aria-hidden
        className="absolute top-1/2 right-[0.2rem] h-[1.35rem] w-[1.35rem] -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform duration-300"
      />
    </button>
  );
}
