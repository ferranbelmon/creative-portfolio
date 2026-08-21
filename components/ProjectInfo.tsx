import type { ProjectSection } from "@/content/projects";

type ProjectInfoProps = {
  sections: ProjectSection;
  externalUrl?: string;
};

type ParsedLine = {
  label?: string;
  value: string;
};

function parseSectionLines(text: string): ParsedLine[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf(" - ");
      if (separator === -1) return { value: line };
      return {
        label: line.slice(0, separator),
        value: line.slice(separator + 3),
      };
    });
}

function isUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function SectionBlock({
  title,
  lines,
}: {
  title: string;
  lines: ParsedLine[];
}) {
  return (
    <div>
      <h2 className="mb-5 font-display text-xs font-bold uppercase tracking-[0.25em] text-muted">
        {title}
      </h2>
      <dl className="space-y-3 text-sm leading-relaxed md:text-base">
        {lines.map((line, index) =>
          line.label ? (
            <div key={`${line.label}-${index}`} className="grid gap-1 sm:grid-cols-[7rem_1fr]">
              <dt className="text-muted">{line.label}</dt>
              <dd>
                {isUrl(line.value) ? (
                  <a
                    href={line.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-border underline-offset-4 transition-colors hover:text-accent"
                  >
                    {line.value.replace(/^https?:\/\//, "")}
                  </a>
                ) : (
                  line.value
                )}
              </dd>
            </div>
          ) : (
            <dd key={index}>{line.value}</dd>
          ),
        )}
      </dl>
    </div>
  );
}

export function ProjectInfo({ sections, externalUrl }: ProjectInfoProps) {
  const { concept, tools, credits, information } = sections;
  const contextLines = information ? parseSectionLines(information) : [];
  const collaborationLines = credits ? parseSectionLines(credits) : [];
  const toolTags = tools
    ? tools
        .split("\n")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  const hasMeta = contextLines.length > 0 || collaborationLines.length > 0;

  return (
    <section className="mt-12 md:mt-16">
      {concept ? (
        <div className="max-w-3xl">
          <h2 className="mb-5 font-display text-xs font-bold uppercase tracking-[0.25em] text-muted">
            Concept
          </h2>
          <p className="text-base leading-relaxed whitespace-pre-line text-foreground/85 md:text-lg md:leading-relaxed">
            {concept}
          </p>
        </div>
      ) : null}

      {hasMeta ? (
        <div className="mt-12 grid gap-10 md:mt-14 md:grid-cols-2 md:gap-16">
          {contextLines.length > 0 ? (
            <SectionBlock title="Context" lines={contextLines} />
          ) : null}
          {collaborationLines.length > 0 ? (
            <SectionBlock title="Credits" lines={collaborationLines} />
          ) : null}
        </div>
      ) : null}

      {toolTags.length > 0 ? (
        <div className="mt-10 md:mt-12">
          <h2 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.25em] text-muted">
            Technical notes
          </h2>
          <ul className="flex flex-wrap gap-2">
            {toolTags.map((tag) => (
              <li
                key={tag}
                className="border border-border px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-muted"
              >
                {tag}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {externalUrl ? (
        <p className="mt-10 md:mt-12">
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display text-sm font-bold uppercase tracking-[0.2em] transition-colors hover:text-accent"
          >
            View project →
          </a>
        </p>
      ) : null}
    </section>
  );
}
