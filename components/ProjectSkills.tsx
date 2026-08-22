import type { ProjectSkill } from "@/content/projects";

const skillLabels: Record<ProjectSkill, string> = {
  sound: "Sound",
  visuals: "Visuals",
  coding: "Creative coding",
  hardware: "Hardware / installation",
};

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

export function ProjectSkills({
  skills,
  className = "",
  size = "sm",
}: ProjectSkillsProps) {
  if (!skills?.length) return null;

  const iconBox =
    size === "md"
      ? "h-5 w-5 text-muted md:h-8 md:w-8"
      : size === "xs"
        ? "h-3 w-3 text-foreground/85"
        : "h-3.5 w-3.5 text-foreground/85 md:h-4 md:w-4";

  return (
    <ul
      className={`relative z-10 flex flex-nowrap items-center ${
        size === "xs"
          ? "gap-0.5"
          : size === "md"
            ? "gap-1.5 md:gap-2"
            : "gap-0.5 md:gap-2"
      } ${className}`}
      aria-label="Project skills"
    >
      {skills.map((skill) => {
        const label = skillLabels[skill];

        return (
          <li
            key={skill}
            className={`group/skill relative z-0 hover:z-50 focus-within:z-50 ${
              size === "xs"
                ? "-mx-0.5 px-0.5 py-1"
                : "-mx-0.5 px-0.5 py-1 md:-mx-1 md:px-1 md:-my-2 md:py-2"
            }`}
          >
            <span
              tabIndex={0}
              aria-label={label}
              className={`inline-flex items-center justify-center outline-none ${iconBox}`}
            >
              <SkillIcon skill={skill} />
            </span>
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-background px-2.5 py-1 font-display text-[0.65rem] font-bold uppercase tracking-[0.14em] text-foreground opacity-0 shadow-sm transition-opacity duration-150 group-hover/skill:opacity-100 group-focus-within/skill:opacity-100"
            >
              {label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
