"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ProjectSkill } from "@/content/projects";

const skillLabels: Record<ProjectSkill, string> = {
  sound: "Sound",
  visuals: "Visuals",
  coding: "Coding",
  hardware: "Installation",
};

const TOOLTIP_GAP = 8;
const VIEWPORT_PAD = 8;

function SkillIcon({ skill }: { skill: ProjectSkill }) {
  const common = {
    className: "h-full w-full",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (skill) {
    case "sound":
      return (
        <svg {...common}>
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="none" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7" fill="none" />
          <path d="M19 5a9 9 0 0 1 0 14" fill="none" />
        </svg>
      );
    case "visuals":
      return (
        <svg {...common}>
          <path
            d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
            fill="none"
          />
          <circle cx="12" cy="12" r="3" fill="none" />
        </svg>
      );
    case "coding":
      return (
        <svg {...common}>
          <rect x="2" y="4" width="20" height="14" rx="2" fill="none" />
          <path d="M8 21h8" fill="none" />
          <path d="M12 18v3" fill="none" />
        </svg>
      );
    case "hardware":
      return (
        <svg {...common}>
          <rect x="5" y="5" width="14" height="14" rx="2" fill="none" />
          <path d="M9 9h6v6H9z" fill="none" />
          <path
            d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"
            fill="none"
          />
        </svg>
      );
  }
}

type ProjectSkillsProps = {
  skills?: ProjectSkill[];
  className?: string;
  /** Larger icons on project pages */
  size?: "xs" | "sm" | "md";
};

type TooltipState = {
  skill: ProjectSkill;
  x: number;
  y: number;
  placement: "above" | "below";
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function measureIcon(node: HTMLElement) {
  const icon =
    (node.querySelector("[data-skill-icon]") as HTMLElement | null) ?? node;
  return icon.getBoundingClientRect();
}

export function ProjectSkills({
  skills,
  className = "",
  size = "sm",
}: ProjectSkillsProps) {
  const tooltipId = useId();
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [mounted, setMounted] = useState(false);
  const activeNodeRef = useRef<HTMLElement | null>(null);
  const activeSkillRef = useRef<ProjectSkill | null>(null);
  const tipRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!tooltip) return;

    let frame = 0;

    const syncPosition = () => {
      const node = activeNodeRef.current;
      const skill = activeSkillRef.current;
      if (!node || !skill) return;

      const icon = measureIcon(node);
      const tip = tipRef.current?.getBoundingClientRect();
      const tipW = tip?.width ?? 96;
      const tipH = tip?.height ?? 28;
      const spaceAbove = icon.top - VIEWPORT_PAD;
      const placement =
        spaceAbove >= tipH + TOOLTIP_GAP ? "above" : "below";

      const x = clamp(
        icon.left + icon.width / 2,
        VIEWPORT_PAD + tipW / 2,
        window.innerWidth - VIEWPORT_PAD - tipW / 2,
      );
      const y = placement === "above" ? icon.top : icon.bottom;

      setTooltip((prev) => {
        if (
          prev &&
          prev.skill === skill &&
          prev.placement === placement &&
          Math.abs(prev.x - x) < 0.5 &&
          Math.abs(prev.y - y) < 0.5
        ) {
          return prev;
        }
        return { skill, x, y, placement };
      });
    };

    const loop = () => {
      syncPosition();
      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    window.addEventListener("scroll", syncPosition, { passive: true });
    window.addEventListener("resize", syncPosition, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", syncPosition);
      window.removeEventListener("resize", syncPosition);
    };
  }, [tooltip?.skill]);

  if (!skills?.length) return null;

  const iconBox =
    size === "md"
      ? "h-5 w-5 text-muted md:h-8 md:w-8"
      : size === "xs"
        ? "h-3 w-3 text-foreground/85"
        : "h-4 w-4 text-foreground/85";

  const hitBox =
    size === "md"
      ? "h-11 w-9 md:h-12 md:w-10"
      : size === "xs"
        ? "h-8 w-7"
        : "h-10 w-8";

  function showTooltip(skill: ProjectSkill, node: HTMLElement) {
    activeNodeRef.current = node;
    activeSkillRef.current = skill;
    const rect = measureIcon(node);
    const spaceAbove = rect.top - VIEWPORT_PAD;
    const placement = spaceAbove >= 36 ? "above" : "below";
    setTooltip({
      skill,
      x: rect.left + rect.width / 2,
      y: placement === "above" ? rect.top : rect.bottom,
      placement,
    });
  }

  function hideTooltip() {
    activeNodeRef.current = null;
    activeSkillRef.current = null;
    setTooltip(null);
  }

  return (
    <>
      <ul
        className={`relative z-20 flex flex-nowrap items-center ${
          size === "xs"
            ? "gap-0"
            : size === "md"
              ? "gap-0.5 md:gap-1"
              : "gap-0"
        } ${className}`}
        aria-label="Project skills"
      >
        {skills.map((skill) => {
          const label = skillLabels[skill];
          const isActive = tooltip?.skill === skill;

          return (
            <li key={skill} className="relative shrink-0">
              <span
                tabIndex={0}
                aria-label={label}
                aria-describedby={isActive ? tooltipId : undefined}
                className={`relative z-10 inline-flex items-center justify-center outline-none ${hitBox}`}
                onPointerEnter={(event) => {
                  if (event.pointerType === "touch") return;
                  showTooltip(skill, event.currentTarget);
                }}
                onPointerLeave={(event) => {
                  if (event.pointerType === "touch") return;
                  hideTooltip();
                }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  if (event.pointerType !== "touch") return;
                  event.preventDefault();
                  if (isActive) hideTooltip();
                  else showTooltip(skill, event.currentTarget);
                }}
                onClick={(event) => {
                  if (
                    event.nativeEvent instanceof PointerEvent &&
                    event.nativeEvent.pointerType === "touch"
                  ) {
                    event.preventDefault();
                    event.stopPropagation();
                  }
                }}
                onFocus={(event) => showTooltip(skill, event.currentTarget)}
                onBlur={hideTooltip}
              >
                <span
                  data-skill-icon
                  className={`pointer-events-none inline-flex items-center justify-center ${iconBox}`}
                >
                  <SkillIcon skill={skill} />
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      {mounted && tooltip
        ? createPortal(
            <span
              ref={tipRef}
              id={tooltipId}
              role="tooltip"
              className={`pointer-events-none fixed z-[300] -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-background px-3 py-1.5 text-center font-display text-[0.62rem] font-bold uppercase leading-snug tracking-[0.1em] text-foreground shadow-sm ${
                tooltip.placement === "above"
                  ? "-translate-y-[calc(100%+0.45rem)]"
                  : "translate-y-[0.45rem]"
              }`}
              style={{ left: tooltip.x, top: tooltip.y }}
            >
              {skillLabels[tooltip.skill]}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}
