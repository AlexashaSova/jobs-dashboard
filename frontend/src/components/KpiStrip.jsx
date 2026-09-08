import { useWidget } from "../hooks/useWidget.js";
import { fmtInt, fmtMoney, fmtPct } from "../charts/format.js";

const CARDS = [
  { key: "total_postings", label: "Job postings", fmt: fmtInt },
  { key: "companies", label: "Companies hiring", fmt: fmtInt },
  { key: "median_salary", label: "Median salary (yearly, USD)", fmt: fmtMoney },
  { key: "remote_pct", label: "Remote-friendly", fmt: fmtPct },
  { key: "with_description_pct", label: "With a job description", fmt: fmtPct },
  { key: "avg_applies", label: "Applications per posting", fmt: (v) => v.toFixed(1) },
];

export default function KpiStrip({ filters }) {
  const { rows, error } = useWidget("kpi", filters);
  const row = rows?.[0];

  return (
    <div className="kpi-strip" aria-label="Key figures">
      {CARDS.map((c) => (
        <div className="kpi" key={c.key}>
          <div className="label">{c.label}</div>
          <div className={`value${row ? "" : " skeleton"}`}>
            {error ? "—" : row ? (row[c.key] == null ? "—" : c.fmt(row[c.key])) : "00000"}
          </div>
        </div>
      ))}
    </div>
  );
}
