"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Plus, Minus } from "@phosphor-icons/react";
import type { FAQItem } from "@/content/salon";
const subscribe = () => () => {};

function Entry({ item }: { item: FAQItem }) {
  const id = useId();
  const details = useRef<HTMLDetailsElement>(null);
  const answer = useRef<HTMLDivElement>(null);
  const animation = useRef<Animation | null>(null);
  const expanded = useRef(false);
  const [open, setOpen] = useState(false);
  const enhanced = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finish = () => {
      animation.current?.cancel();
      animation.current = null;
      if (details.current) details.current.open = expanded.current;
      if (answer.current) answer.current.style.removeProperty("overflow");
      details.current?.dispatchEvent(
        new Event("page-layout-change", { bubbles: true }),
      );
    };
    media.addEventListener("change", finish);
    return () => {
      animation.current?.cancel();
      media.removeEventListener("change", finish);
    };
  }, []);

  function toggle() {
    const panel = answer.current;
    const element = details.current;
    if (!panel || !element) return;
    const next = !expanded.current;
    expanded.current = next;
    setOpen(next);
    const from = element.open ? panel.getBoundingClientRect().height : 0;
    animation.current?.cancel();
    element.open = true;
    const to = next ? panel.scrollHeight : 0;
    const finish = () => {
      element.open = next;
      panel.style.removeProperty("overflow");
      animation.current = null;
      element.dispatchEvent(new Event("page-layout-change", { bubbles: true }));
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }
    panel.style.overflow = "hidden";
    animation.current = panel.animate(
      [{ height: `${from}px` }, { height: `${to}px` }],
      { duration: 250, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
    );
    animation.current.onfinish = finish;
  }

  return (
    <details ref={details} className="faq-item">
      <summary
        role="button"
        aria-expanded={enhanced ? open : undefined}
        aria-controls={id}
        onClick={(event) => {
          event.preventDefault();
          toggle();
        }}
      >
        <h3>{item.question}</h3>
        {open ? (
          <Minus size={21} weight="light" aria-hidden="true" />
        ) : (
          <Plus size={21} weight="light" aria-hidden="true" />
        )}
      </summary>
      <div ref={answer} className="faq-answer" id={id}>
        <div>
          <p>{item.answer}</p>
        </div>
      </div>
    </details>
  );
}

export function FAQAccordion({ items }: { items: FAQItem[] }) {
  return (
    <div className="faq-list">
      {items.map((item) => (
        <Entry key={item.question} item={item} />
      ))}
    </div>
  );
}
