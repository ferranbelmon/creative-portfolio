import type { ProjectSkill } from "@/content/projects";

const skillLabels: Record<ProjectSkill, string> = {
  sound: "Sound",
  visuals: "Visuals",
  coding: "Creative coding",
  hardware: "Hardware / installation",
};

function SkillIcon({ skill }: { skill: ProjectSkill }) {
  const common = {
    width: 18,
    height: 18,
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
  size?: "sm" | "md";
};

export function ProjectSkills({
  skills,
  className = "",
  size = "sm",
}: ProjectSkillsProps) {
  if (!skills?.length) return null;

  const showTooltip = size === "md";
  const iconBox =
    size === "md" ? "h-8 w-8 text-muted" : "h-6 w-6 text-foreground/85";

  return (
    <ul
      className={`flex flex-wrap items-center gap-2 ${className}`}
      aria-label="Project skills"
    >
      {skills.map((skill) => {
        const label = skillLabels[skill];

        return (
          <li key={skill} className="relative">
            <button
              type="button"
              aria-label={label}
              className={`group relative inline-flex items-center justify-center outline-none ${iconBox}`}
            >
              <SkillIcon skill={skill} />
              {showTooltip ? (
                <span
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-background px-2.5 py-1 font-display text-[0.65rem] font-bold uppercase tracking-[0.14em] text-foreground opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  {label}
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
