import type { ReactNode } from "react";

interface Props {
  open: boolean;
  onToggle(): void;
  summary: ReactNode;
  children: ReactNode;
}

export function MobileSheet({ open, onToggle, summary, children }: Props) {
  return (
    <section className={`sheet pointer-events-auto ${open ? "is-open" : ""}`} aria-label="Aircraft status">
      <button type="button" className="sheet-handle" onClick={onToggle} aria-expanded={open}>
        <span className="sheet-grip" aria-hidden="true" />
        <div className="sheet-summary">{summary}</div>
        <span className="sheet-chevron" aria-hidden="true">
          ⌃
        </span>
      </button>
      <div className="sheet-body">{children}</div>
    </section>
  );
}
