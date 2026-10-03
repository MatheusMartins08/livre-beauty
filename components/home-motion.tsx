"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function HomeMotion({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  const scope = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add(
        "(prefers-reduced-motion: no-preference)",
        () => {
          // Progressive enhancement: SSR/CSS never hide the photograph or content.
          gsap.fromTo(
            "[data-hero-image]",
            { scale: 1.025 },
            {
              scale: 1,
              duration: 0.9,
              ease: "power3.out",
              clearProps: "transform",
            },
          );
          gsap.from("[data-hero-copy]", {
            opacity: 0,
            y: 24,
            duration: 0.65,
            stagger: 0.07,
            ease: "power3.out",
            clearProps: "opacity,transform",
          });

          const root = scope.current;
          if (!root) return;
          const removeListeners: (() => void)[] = [];
          root
            .querySelectorAll<HTMLElement>("[data-home-section]")
            .forEach((section) => {
              const elements =
                section.querySelectorAll<HTMLElement>("[data-home-reveal]");
              const images =
                section.querySelectorAll<HTMLElement>("[data-home-image]");
              // Set up one timeline per section; no CSS reveals target these elements.
              // A finished timeline never rewinds. Keep its trigger until context cleanup:
              // removing once-triggers during another trigger's initial refresh can race.
              const timeline = gsap.timeline({
                scrollTrigger: {
                  trigger: section,
                  start: "top 88%",
                  toggleActions: "play none none none",
                },
                defaults: { duration: 0.65, ease: "power3.out" },
              });
              timeline.from(elements, {
                opacity: 0,
                y: 24,
                stagger: {
                  each: 0.06,
                  amount: Math.min((elements.length - 1) * 0.06, 0.18),
                },
                clearProps: "opacity,transform",
              });
              if (images.length)
                timeline.from(
                  images,
                  { scale: 1.025, duration: 0.8, clearProps: "transform" },
                  0,
                );
              // Reading via Tab must never wait for an off-screen reveal.
              const revealOnFocus = (event: FocusEvent) => {
                // Completing on pointer focus shifts the hit target between
                // pointerdown/up. Only keyboard focus needs an instant reveal.
                if ((event.target as HTMLElement).matches(":focus-visible"))
                  timeline.progress(1);
              };
              section.addEventListener("focusin", revealOnFocus);
              removeListeners.push(() =>
                section.removeEventListener("focusin", revealOnFocus),
              );
            });
          return () => removeListeners.forEach((remove) => remove());
        },
        scope,
      );
      media.add(
        "(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
        () => {
          gsap.fromTo(
            "[data-home-parallax]",
            { y: -16 },
            {
              y: 16,
              ease: "none",
              scrollTrigger: {
                trigger: "[data-home-parallax]",
                start: "top bottom",
                end: "bottom top",
                scrub: 0.5,
              },
            },
          );
        },
        scope,
      );

      // A completed accordion transition changes subsequent trigger positions.
      const refresh = () => ScrollTrigger.refresh();
      const root = scope.current;
      root?.addEventListener("page-layout-change", refresh);
      return () => {
        root?.removeEventListener("page-layout-change", refresh);
        media.revert();
      };
    },
    { scope },
  );

  return (
    <div ref={scope} className={className} data-home-page>
      {children}
    </div>
  );
}
