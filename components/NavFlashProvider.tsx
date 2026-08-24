"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import { NavFlashOverlay } from "@/components/NavFlashOverlay";

/** Parked for now — set true to re-enable the WebGL nav flash (`lib/nav-flash/shader.ts`). */
export const ENABLE_NAV_FLASH = false;

const ROUTE_WAIT_MS = 2800;

type RouteWaiter = {
  path: string;
  resolve: () => void;
};

type NavFlashSession = {
  resolvePeak: () => void;
  resolveDone: () => void;
};

type NavFlashContextValue = {
  navigateWithFlash: (href: string) => void;
};

const NavFlashContext = createContext<NavFlashContextValue | null>(null);

export function normalizeNavPath(href: string) {
  const path = href.split("#")[0]?.split("?")[0] ?? "/";
  if (!path || path === "") return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

export function NavFlashProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const busyRef = useRef(false);
  const routeWaitersRef = useRef<RouteWaiter[]>([]);
  const pendingHrefRef = useRef<string | null>(null);
  const sessionRef = useRef<NavFlashSession | null>(null);
  const [flashActive, setFlashActive] = useState(false);

  useEffect(() => {
    const current = normalizeNavPath(pathname);
    routeWaitersRef.current = routeWaitersRef.current.filter((waiter) => {
      if (waiter.path === current) {
        waiter.resolve();
        return false;
      }
      return true;
    });
  }, [pathname]);

  const waitForRoute = useCallback(
    (targetPath: string) => {
      const normalized = normalizeNavPath(targetPath);
      if (normalizeNavPath(pathname) === normalized) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        const waiter: RouteWaiter = { path: normalized, resolve };
        routeWaitersRef.current.push(waiter);
        window.setTimeout(() => {
          const index = routeWaitersRef.current.indexOf(waiter);
          if (index >= 0) {
            routeWaitersRef.current.splice(index, 1);
            resolve();
          }
        }, ROUTE_WAIT_MS);
      });
    },
    [pathname],
  );

  const handlePeak = useCallback(() => {
    const href = pendingHrefRef.current;
    if (href) router.push(href);
    sessionRef.current?.resolvePeak();
  }, [router]);

  const handleDone = useCallback(() => {
    sessionRef.current?.resolveDone();
  }, []);

  const navigateWithFlash = useCallback(
    async (href: string) => {
      if (!ENABLE_NAV_FLASH || reduceMotion) {
        router.push(href);
        return;
      }

      if (busyRef.current) return;

      const targetPath = normalizeNavPath(href);

      busyRef.current = true;
      pendingHrefRef.current = href;

      let resolvePeak!: () => void;
      let resolveDone!: () => void;
      const overlayDone = new Promise<void>((resolve) => {
        resolveDone = resolve;
      });
      const peakPromise = new Promise<void>((resolve) => {
        resolvePeak = resolve;
      });
      sessionRef.current = { resolvePeak, resolveDone };

      setFlashActive(true);

      await peakPromise;
      await waitForRoute(targetPath);
      await overlayDone;

      setFlashActive(false);
      pendingHrefRef.current = null;
      sessionRef.current = null;
      busyRef.current = false;
    },
    [reduceMotion, router, waitForRoute],
  );

  return (
    <NavFlashContext.Provider value={{ navigateWithFlash }}>
      {children}
      {ENABLE_NAV_FLASH ? (
        <NavFlashOverlay
          active={flashActive}
          onPeak={handlePeak}
          onDone={handleDone}
        />
      ) : null}
    </NavFlashContext.Provider>
  );
}

export function useNavFlash() {
  return useContext(NavFlashContext);
}
