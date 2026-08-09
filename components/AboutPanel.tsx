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
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 md:p-8"
          role="presentation"
        >
          <motion.button
            type="button"
            aria-label="Close about"
            className="absolute inset-0 bg-background/40 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            onClick={onClose}
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-panel-title"
            className="about-float-card relative z-10 flex max-h-[min(88vh,42rem)] w-full max-w-xl flex-col overflow-hidden rounded-[1.75rem] border border-white/12 bg-surface/45 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:rounded-[2rem]"
            initial={{ x: 96, opacity: 0, scale: 0.96 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 72, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 280, damping: 30, mass: 0.85 }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/[0.06] via-transparent to-accent/[0.03]"
            />

            <div className="relative flex items-start justify-between gap-4 border-b border-white/8 px-6 py-6 md:px-8 md:py-7">
              <div>
                <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.35em] text-accent">
                  About
                </p>
                <h2
                  id="about-panel-title"
                  className="font-display text-2xl font-extrabold uppercase leading-[0.95] tracking-tight md:text-[1.85rem]"
                >
                  New media artist & creative coder
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 rounded-full border border-white/12 bg-white/[0.04] px-3 py-2 font-display text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted transition-colors hover:border-accent/40 hover:text-accent"
              >
                Close
              </button>
            </div>

            <div className="relative flex-1 overflow-y-auto px-6 py-6 md:px-8 md:py-7">
              <div className="space-y-5 text-[0.95rem] leading-relaxed text-foreground/80 md:text-base md:leading-relaxed">
                {site.bio.map((paragraph) => (
                  <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                ))}
              </div>

              <a
                href={`mailto:${site.email}`}
                className="group mt-10 inline-flex items-center gap-3 font-display text-sm font-bold uppercase tracking-[0.25em]"
              >
                <span className="transition-colors group-hover:text-accent">Contact</span>
                <span className="inline-block h-px w-8 bg-foreground/70 transition-all group-hover:w-16 group-hover:bg-accent" />
              </a>
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
