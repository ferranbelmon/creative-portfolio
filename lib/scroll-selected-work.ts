export const SELECTED_WORK_SCROLL_KEY = "scroll-to-selected-work";

/** Same landing as the home “Selected work” button. */
export function scrollToSelectedWork() {
  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  if (isMobile) {
    const heading = document.getElementById("selected-work-heading");
    if (!heading) return;
    const top =
      heading.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    return;
  }

  document
    .getElementById("selected-work-ciclic")
    ?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export function markScrollToSelectedWork() {
  try {
    sessionStorage.setItem(SELECTED_WORK_SCROLL_KEY, "1");
  } catch {
    // ignore
  }
}

export function peekScrollToSelectedWork() {
  try {
    return sessionStorage.getItem(SELECTED_WORK_SCROLL_KEY) === "1";
  } catch {
    return false;
  }
}

export function consumeScrollToSelectedWork() {
  try {
    if (sessionStorage.getItem(SELECTED_WORK_SCROLL_KEY) !== "1") return false;
    sessionStorage.removeItem(SELECTED_WORK_SCROLL_KEY);
    return true;
  } catch {
    return false;
  }
}
