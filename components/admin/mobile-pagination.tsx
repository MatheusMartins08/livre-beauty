"use client";

import { useRef, useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

/** CSS applies these page boundaries below 1000px; desktop keeps the full list. */
export function useMobilePagination(ids: string[], pageSize = 4) {
  const key = ids.join("|");
  const [selection, setSelection] = useState({ key, page: 0 });
  // Commit the new result set, so clearing a filter cannot revive an old page.
  if (selection.key !== key) setSelection({ key, page: 0 });
  const pageCount = Math.max(1, Math.ceil(ids.length / pageSize));
  const page =
    selection.key === key ? Math.min(selection.page, pageCount - 1) : 0;
  return {
    page,
    pageSize,
    pageCount,
    total: ids.length,
    onPageChange: (next: number) =>
      setSelection({ key, page: Math.max(0, Math.min(next, pageCount - 1)) }),
    rowClass: (index: number) =>
      index >= page * pageSize && index < (page + 1) * pageSize
        ? undefined
        : "lb-mobile-page-hidden",
  };
}

export function MobilePagination({
  page,
  pageCount,
  pageSize,
  total,
  onPageChange,
  label,
}: {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  label: string;
}) {
  const ref = useRef<HTMLElement>(null);
  if (pageCount <= 1) return null;
  function changePage(next: number) {
    onPageChange(next);
    const panel = ref.current?.closest<HTMLElement>(
      ".lb-panel, .lb-client-detail",
    );
    // Keep the next group in view instead of leaving the reader at the list's end.
    requestAnimationFrame(() =>
      panel?.scrollIntoView({ block: "start", behavior: "instant" }),
    );
  }
  return (
    <nav ref={ref} className="lb-mobile-pagination" aria-label={label}>
      <span aria-live="polite" aria-atomic="true">
        {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} de{" "}
        {total}
      </span>
      <div>
        <button
          type="button"
          className="lb-icon-button"
          aria-label="Página anterior"
          disabled={page === 0}
          onClick={() => changePage(page - 1)}
        >
          <CaretLeft size={18} aria-hidden="true" />
        </button>
        <span>
          {page + 1} / {pageCount}
        </span>
        <button
          type="button"
          className="lb-icon-button"
          aria-label="Próxima página"
          disabled={page === pageCount - 1}
          onClick={() => changePage(page + 1)}
        >
          <CaretRight size={18} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
