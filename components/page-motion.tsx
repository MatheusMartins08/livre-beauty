"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Server-rendered content stays visible until motion progressively enhances it. */
export function PageMotion({
  children,
  animate = true,
}: {
  children: ReactNode;
  animate?: boolean;
}) {
  const scope = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const root = scope.current;
      if (!root || !animate) return;
      const media = gsap.matchMedia();
      media.add(
        "(prefers-reduced-motion: no-preference)",
        () => {
          const removeListeners: (() => void)[] = [];
          root
            .querySelectorAll<HTMLElement>("[data-page-section]")
            .forEach((section) => {
              const targets =
                section.querySelectorAll<HTMLElement>("[data-page-reveal]");
              if (!targets.length) return;
              const timeline = gsap.timeline({
                scrollTrigger: {
                  trigger: section,
                  start: "top 88%",
                  toggleActions: "play none none none",
                },
              });
              timeline.from(targets, {
                opacity: 0,
                y: 24,
                duration: 0.65,
                ease: "power3.out",
                stagger: {
                  each: 0.06,
                  amount: Math.min((targets.length - 1) * 0.06, 0.18),
                },
                clearProps: "opacity,transform",
              });
              const focus = (event: FocusEvent) => {
                if ((event.target as HTMLElement).matches(":focus-visible"))
                  timeline.progress(1);
              };
              section.addEventListener("focusin", focus);
              removeListeners.push(() =>
                section.removeEventListener("focusin", focus),
              );
            });
          return () => removeListeners.forEach((remove) => remove());
        },
        scope,
      );
      media.add(
        "(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
        () => {
          const image = root.querySelector("[data-page-parallax]");
          if (image)
            gsap.fromTo(
              image,
              { y: -16 },
              {
                y: 16,
                ease: "none",
                scrollTrigger: {
                  trigger: image,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: 0.5,
                },
              },
            );
        },
        scope,
      );
      const refresh = () => ScrollTrigger.refresh();
      root.addEventListener("page-layout-change", refresh);
      return () => {
        root.removeEventListener("page-layout-change", refresh);
        media.revert();
      };
    },
    { scope, dependencies: [animate], revertOnUpdate: true },
  );
  return (
    <div ref={scope} data-editorial-page>
      {children}
    </div>
  );
}
