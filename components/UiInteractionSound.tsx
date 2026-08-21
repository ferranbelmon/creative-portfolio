"use client";

import { useEffect } from "react";
import { getSonificationController } from "@/lib/sonification/controller";

const INTERACTIVE =
  "a[href], button, [role='button'], [role='link'], summary, input[type='button'], input[type='submit'], label[for]";

function interactiveFromTarget(target: EventTarget | null): Element | null {
  const start =
    target instanceof Element
      ? target
      : target instanceof Node
        ? target.parentElement
        : null;
  if (!start) return null;
  const el = start.closest(INTERACTIVE);
  if (!el) return null;
  if (el instanceof HTMLButtonElement && el.disabled) return null;
  if (el.getAttribute("aria-disabled") === "true") return null;
  return el;
}

function isProjectLink(el: Element): boolean {
  if (!(el instanceof HTMLAnchorElement)) return false;
  try {
    const url = new URL(el.href, window.location.origin);
    return /^\/projects\/[^/]+\/?$/.test(url.pathname);
  } catch {
    return false;
  }
}

/**
 * UI tones follow the ambient harmony.
 * Projects → tonic (resolved); other clicks → scale degree from storm country;
 * filters → vaporous noise.
 */
export function UiInteractionSound() {
  useEffect(() => {
    let lastAt = 0;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const el = interactiveFromTarget(event.target);
      if (!el) return;

      const now = performance.now();
      if (now - lastAt < 120) return;
      lastAt = now;

      const tone =
        el.closest("[data-ui-tone]")?.getAttribute("data-ui-tone") ??
        el.getAttribute("data-ui-tone");

      void (async () => {
        try {
          const controller = getSonificationController();
          const ok = await controller.ensurePlaying();
          if (!ok) return;

          if (tone === "vapor") {
            controller.audio.triggerUiToneVapor();
          } else if (tone === "tonic" || isProjectLink(el)) {
            controller.audio.triggerUiToneTonic();
          } else if (tone === "classic") {
            controller.audio.triggerUiToneClassic();
          } else {
            controller.audio.triggerUiTone();
          }
        } catch {
          // Audio not available yet.
        }
      })();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, []);

  return null;
}
