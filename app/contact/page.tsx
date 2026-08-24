import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BarcelonaGmt } from "@/components/BarcelonaGmt";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description: site.contact.intro,
  alternates: {
    canonical: "/contact",
  },
};

const labelClass =
  "font-display text-[clamp(1.35rem,4vw,2.4rem)] font-extrabold lowercase tracking-[-0.03em] text-accent";

const valueClass =
  "font-display text-[clamp(1.1rem,2.5vw,1.75rem)] font-bold tracking-[-0.02em] text-foreground transition-opacity hover:opacity-80";

function ContactRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-border pt-6 first:border-t-0 first:pt-0 md:pt-8">
      <p className={labelClass}>{label}</p>
      <div className="mt-2 min-w-0 md:mt-3">{children}</div>
    </div>
  );
}

export default function ContactPage() {
  const instagramUrl = site.social.instagram;

  return (
    <main className="mx-auto min-w-0 max-w-[1600px] overflow-x-hidden px-5 py-12 md:px-8 md:py-16">
      <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.35em] text-accent">
        Contact
      </p>
      <h1 className="font-display max-w-3xl break-words text-[clamp(1.75rem,6.5vw,3.5rem)] font-extrabold uppercase leading-[0.95] tracking-tight">
        Get in touch
      </h1>

      <p className="mt-8 max-w-2xl font-display text-[clamp(1.1rem,2.8vw,1.65rem)] font-bold lowercase leading-[1.35] tracking-[-0.02em] text-foreground md:mt-10 md:leading-[1.4]">
        {site.contact.intro}
      </p>

      <div className="mt-10 max-w-2xl md:mt-14">
        <ContactRow label="Email">
          <a href={`mailto:${site.email}`} className={valueClass}>
            {site.email}
          </a>
        </ContactRow>

        <ContactRow label="Social">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={valueClass}
          >
            {site.contact.instagramHandle}
          </a>
        </ContactRow>

        <ContactRow label="Base">
          <p className={valueClass}>
            {site.contact.base} (<BarcelonaGmt />)
          </p>
        </ContactRow>
      </div>
    </main>
  );
}
