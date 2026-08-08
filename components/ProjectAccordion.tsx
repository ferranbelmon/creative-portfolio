import type { ProjectSection } from "@/content/projects";

const sectionLabels: Record<keyof ProjectSection, string> = {
  concept: "Concept",
  tools: "Tools",
  credits: "Credits",
  information: "Information",
};

type ProjectAccordionProps = {
  sections: ProjectSection;
};

export function ProjectAccordion({ sections }: ProjectAccordionProps) {
  const entries = (
    Object.entries(sections) as [keyof ProjectSection, string | undefined][]
  ).filter(([, value]) => Boolean(value?.trim()));

  return (
    <div className="border-t border-border">
      {entries.map(([key, value], index) => (
        <details
          key={key}
          open={index === 0}
          className="group border-b border-border"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between py-6 transition-colors hover:text-accent [&::-webkit-details-marker]:hidden">
            <span className="font-display text-sm font-bold uppercase tracking-[0.25em]">
              {sectionLabels[key]}
            </span>
            <span className="text-xl font-light leading-none transition-transform duration-300 group-open:rotate-45 group-open:text-accent">
              +
            </span>
          </summary>
          <div className="pb-8 text-base leading-relaxed text-muted whitespace-pre-line md:text-lg md:leading-relaxed">
            {value}
          </div>
        </details>
      ))}
    </div>
  );
}
