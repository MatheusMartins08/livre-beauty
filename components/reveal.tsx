"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Progressive enhancement: content is visible by default, even without JavaScript.
export function RevealController() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname === "/") return; // The homepage owns its GSAP timelines.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const element = entry.target as HTMLElement;
          if (element.getBoundingClientRect().top > 0)
            element.classList.add("reveal-enter");
          observer.unobserve(element);
        });
      },
      { threshold: 0.08 },
    );
    document
      .querySelectorAll("[data-reveal]")
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [pathname]);
  return null;
}
