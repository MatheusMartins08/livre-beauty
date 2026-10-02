"use client";
import { useId, useState, useSyncExternalStore } from "react";
import { Plus, Minus } from "@phosphor-icons/react";
import type { FAQItem } from "@/content/salon";
const subscribe = () => () => {};
function FAQEntry({
  item,
  index,
  prefix,
}: {
  item: FAQItem;
  index: number;
  prefix: string;
}) {
  const [open, setOpen] = useState(false);
  const enhanced = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return (
    <details
      className="faq-item"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary
        role="button"
        aria-expanded={enhanced ? open : undefined}
        aria-controls={`${prefix}-${index}`}
      >
        <h3>{item.question}</h3>
        {open ? (
          <Minus size={21} weight="light" aria-hidden="true" />
        ) : (
          <Plus size={21} weight="light" aria-hidden="true" />
        )}
      </summary>
      <div className="faq-answer" id={`${prefix}-${index}`}>
        <div>
          <p>{item.answer}</p>
        </div>
      </div>
    </details>
  );
}
export function FAQAccordion({ items }: { items: FAQItem[] }) {
  const id = useId();
  return (
    <div className="faq-list">
      {items.map((item, index) => (
        <FAQEntry key={item.question} item={item} index={index} prefix={id} />
      ))}
    </div>
  );
}
