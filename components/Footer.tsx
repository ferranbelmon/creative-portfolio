"use client";

import { LocalTimeStatus } from "@/components/LocalTimeStatus";

export function Footer() {
  return (
    <footer className="fixed right-0 bottom-0 left-0 z-50 border-t border-border bg-background/90 px-5 py-4 backdrop-blur-md md:px-8 md:py-5">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
        <LocalTimeStatus />
      </div>
    </footer>
  );
}
