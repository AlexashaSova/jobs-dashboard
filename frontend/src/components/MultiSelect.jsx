import { useEffect, useRef, useState } from "react";

// Випадаючий список із чекбоксами. options: [{value, postings}]
export default function MultiSelect({ label, options, selected, onChange, formatValue }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const toggle = (value) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);

  const fmt = formatValue ?? ((v) => v);
  const summary =
    selected.length === 0
      ? `All ${label.toLowerCase()}`
      : selected.length === 1
        ? fmt(selected[0])
        : `${selected.length} ${label.toLowerCase()}`;

  return (
    <div className="ms" ref={ref}>
      <button
        type="button"
        className={`ms-button${selected.length ? " active" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{summary}</span>
        <span className="chev">▼</span>
      </button>
      {open && (
        <div className="ms-menu" role="listbox">
          {options.map((o) => (
            <label className="ms-item" key={o.value}>
              <input
                type="checkbox"
                checked={selected.includes(o.value)}
                onChange={() => toggle(o.value)}
              />
              <span>{fmt(o.value)}</span>
              <span className="n">{o.postings.toLocaleString("en-US")}</span>
            </label>
          ))}
          <div className="ms-actions">
            <button type="button" onClick={() => onChange(options.map((o) => o.value))}>
              Select all
            </button>
            <button type="button" onClick={() => onChange([])}>
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
