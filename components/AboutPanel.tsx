"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { site } from "@/content/site";

type AboutPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function AboutPanel({ open, onClose }: AboutPanelProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[80]" role="presentation">
          <motion.button
            type="button"
            aria-label="Close about"
            className="absolute inset-0 bg-background/55 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-panel-title"
            className="absolute inset-y-3 right-3 z-10 flex w-[min(100%-1.5rem,28rem)] flex-col overflow-hidden border border-border bg-surface shadow-[0_24px_80px_rgba(0,0,0,0.55)] md:inset-y-5 md:right-5 md:w-[min(100%-2.5rem,32rem)]"
            initial={{ x: "110%", opacity: 0.85 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "110%", opacity: 0.85 }}
            transition={{ type: "spring", stiffness: 320, damping: 34, mass: 0.85 }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-5 md:px-7 md:py-6">
              <div>
                <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.35em] text-accent">
                  About
                </p>
                <h2
                  id="about-panel-title"
                  className="font-display text-2xl font-extrabold uppercase leading-[0.95] tracking-tight md:text-3xl"
                >
                  New media artist & creative coder
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted transition-colors hover:text-accent"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6 md:px-7 md:py-8">
              <div className="space-y-5 text-[0.95rem] leading-relaxed text-foreground/85 md:text-base md:leading-relaxed">
                {site.bio.map((paragraph) => (
                  <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                ))}
              </div>

              <a
                href={`mailto:${site.email}`}
                className="group mt-10 inline-flex items-center gap-3 font-display text-sm font-bold uppercase tracking-[0.25em]"
              >
                <span className="transition-colors group-hover:text-accent">Contact</span>
                <span className="inline-block h-px w-8 bg-foreground transition-all group-hover:w-16 group-hover:bg-accent" />
              </a>
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
