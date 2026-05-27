import { useEffect } from "react";

/**
 * Adds `is-visible` class to all `[data-reveal]` elements when they enter
 * the viewport. Premium, subtle, GPU-friendly. No deps.
 */
export function useRevealOnScroll() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("IntersectionObserver" in window)) {
      document
        .querySelectorAll<HTMLElement>("[data-reveal]")
        .forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
    );
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}