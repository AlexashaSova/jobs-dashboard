import { useMemo } from "react";
import EChart from "./EChart.jsx";
import { useWidget } from "../hooks/useWidget.js";

// Панель одного віджета: заголовок, стан (loading / error / empty), графік.
export default function ChartCard({ spec, filters, chartTheme, theme }) {
  const { rows, error, loading } = useWidget(spec.widget, filters);

  const option = useMemo(() => {
    if (!rows || rows.length === 0) return null;
    return spec.build(rows, chartTheme);
  }, [rows, chartTheme, spec]);

  const Custom = spec.render;

  return (
    <section className={`panel span-${spec.span ?? 6}`}>
      <div className="panel-head">
        <div>
          <h3>{spec.title}</h3>
          {spec.subtitle && <p>{spec.subtitle}</p>}
        </div>
      </div>
      <div className={`panel-body${spec.tall ? " tall" : ""}`}>
        {error && <div className="panel-state error">Couldn't load: {error}</div>}
        {!error && loading && !rows && <div className="panel-state">Loading…</div>}
        {!error && rows && rows.length === 0 && (
          <div className="panel-state">No postings match the current filters.</div>
        )}
        {!error && rows && rows.length > 0 && Custom && <Custom rows={rows} theme={chartTheme} />}
        {!error && option && !Custom && <EChart option={option} theme={theme} />}
      </div>
    </section>
  );
}
