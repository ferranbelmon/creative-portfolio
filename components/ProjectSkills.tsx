import type { ProjectSkill } from "@/content/projects";

const skillLabels: Record<ProjectSkill, string> = {
  sound: "Sound",
  visuals: "Visuals",
  coding: "Creative coding",
  hardware: "Hardware / installation",
};

function SkillIcon({ skill }: { skill: ProjectSkill }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (skill) {
    case "sound":
      return (
        <svg {...common}>
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M19 5a9 9 0 0 1 0 14" />
        </svg>
      );
    case "visuals":
      return (
        <svg {...common}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "coding":
      return (
        <svg {...common}>
          <rect x="2" y="4" width="20" height="14" rx="2" />
          <path d="M8 21h8" />
          <path d="M12 18v3" />
        </svg>
      );
    case "hardware":
      return (
        <svg {...common}>
          <rect x="5" y="5" width="14" height="14" rx="2" />
          <path d="M9 9h6v6H9z" />
          <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
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

  const iconBox =
    size === "md"
      ? "h-9 w-9 border border-border text-muted"
      : "h-7 w-7 border border-border/80 bg-background/50 text-foreground/80 backdrop-blur-sm";

  return (
    <ul
      className={`flex flex-wrap items-center gap-1.5 ${className}`}
      aria-label="Project skills"
    >
      {skills.map((skill) => (
        <li key={skill}>
          <span
            title={skillLabels[skill]}
            aria-label={skillLabels[skill]}
            className={`inline-flex items-center justify-center ${iconBox}`}
          >
            <SkillIcon skill={skill} />
          </span>
        </li>
      ))}
    </ul>
  );
}
