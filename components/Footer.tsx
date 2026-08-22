"use client";

import { LocalTimeStatus } from "@/components/LocalTimeStatus";

export function Footer() {
  return (
    <footer className="pointer-events-none fixed right-0 bottom-0 left-0 z-50 bg-transparent px-5 py-4 md:px-8 md:py-5">
      <div className="pointer-events-auto mx-auto flex max-w-[1600px] items-center justify-between gap-4 text-white mix-blend-difference light:text-foreground light:mix-blend-normal">
        <LocalTimeStatus />
      </div>
    </footer>
  );
}
