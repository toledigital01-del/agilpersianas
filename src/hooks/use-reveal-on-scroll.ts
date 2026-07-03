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
    const observed = new WeakSet<Element>();
    const observeAll = () => {
      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        if (observed.has(el) || el.classList.contains("is-visible")) return;
        observed.add(el);
        io.observe(el);
      });
    };
    observeAll();
    // Reobserve as async content (queries, lazy sections) mounts new nodes.
    const mo = new MutationObserver(() => observeAll());
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      io.disconnect();
    };
  }, []);
}