"use client";

import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";

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
      className="p-2 text-current transition-colors hover:text-accent"
    >
      <Lightbulb
        size={18}
        strokeWidth={1.6}
        className={
          isLight
            ? "fill-accent text-accent"
            : "fill-transparent text-current"
        }
        aria-hidden
      />
    </button>
  );
}
