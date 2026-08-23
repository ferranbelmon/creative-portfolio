"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { peekScrollToSelectedWork } from "@/lib/scroll-selected-work";

/** Next.js App Router keeps scroll position across navigations; reset on route change. */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    if (peekScrollToSelectedWork()) return;
    if (window.location.hash === "#selected-work-heading") return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
