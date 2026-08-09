"use client";

import Link from "next/link";
import { useRef, type PointerEvent } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { RemoteImage } from "@/components/RemoteImage";

type ProjectCardProps = {
  slug: string;
  title: string;
  thumbnail: string;
  index: number;
};

const MAX_TILT = 12;

export function ProjectCard({
  slug,
  title,
  thumbnail,
  index,
}: ProjectCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const springConfig = { stiffness: 220, damping: 22, mass: 0.6 };
  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [MAX_TILT, -MAX_TILT]), springConfig);
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-MAX_TILT, MAX_TILT]), springConfig);
  const glareX = useSpring(useTransform(rawX, [-0.5, 0.5], [0, 100]), springConfig);
  const glareY = useSpring(useTransform(rawY, [-0.5, 0.5], [0, 100]), springConfig);
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(212, 255, 0, 0.22), transparent 55%)`;

  function handlePointerMove(event: PointerEvent<HTMLAnchorElement>) {
    const element = cardRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    rawX.set(x);
    rawY.set(y);
  }

  function handlePointerLeave() {
    rawX.set(0);
    rawY.set(0);
  }

  return (
    <div className="project-card-scene">
      <motion.div
        className="project-card-depth"
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
      >
        <Link
          ref={cardRef}
          href={`/projects/${slug}`}
          className="project-card group relative block aspect-square overflow-hidden bg-surface"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-110"
            style={{ transform: "translateZ(24px)" }}
          >
            <RemoteImage
              src={thumbnail}
              alt={title}
              fill
              className="object-cover transition-opacity duration-700 group-hover:opacity-45"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-90" />

          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 mix-blend-screen transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: glareBackground, transform: "translateZ(40px)" }}
          />

          <div
            className="absolute inset-0 flex flex-col justify-between p-5 md:p-6"
            style={{ transform: "translateZ(56px)" }}
          >
            <span className="font-display text-xs font-bold text-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              {String(index + 1).padStart(2, "0")}
            </span>

            <div>
              <h2 className="font-display text-2xl font-bold uppercase leading-none tracking-tight transition-all duration-300 group-hover:text-accent md:text-3xl lg:text-4xl">
                {title}
              </h2>
              <span className="mt-3 inline-block h-0.5 w-0 bg-accent transition-all duration-500 group-hover:w-full" />
            </div>
          </div>
        </Link>
      </motion.div>
    </div>
  );
}
