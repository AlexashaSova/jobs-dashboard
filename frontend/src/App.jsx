import { useEffect, useMemo, useState } from "react";
import { api } from "./api.js";
import Header from "./components/Header.jsx";
import FilterBar, { EMPTY_FILTERS } from "./components/FilterBar.jsx";
import KpiStrip from "./components/KpiStrip.jsx";
import ChartCard from "./components/ChartCard.jsx";
import { SECTIONS } from "./charts/specs.jsx";
import { readChartTheme, useTheme } from "./hooks/useTheme.js";
import { useWidget } from "./hooks/useWidget.js";

export default function App() {
  const { theme, toggle } = useTheme();
  const [health, setHealth] = useState(null);
  const [filterOptions, setFilterOptions] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  // Кольори для графіків перечитуємо після кожної зміни теми,
  // коли CSS-змінні вже оновились.
  const chartTheme = useMemo(() => readChartTheme(), [theme]);

  useEffect(() => {
    api.health().then(setHealth).catch(() => setHealth(null));
    api.filters().then(setFilterOptions).catch(() => setFilterOptions(null));
  }, []);

  // Кількість вакансій під поточними фільтрами — для підпису в панелі фільтрів.
  const { rows: kpiRows } = useWidget("kpi", filters);
  const matched = kpiRows?.[0]?.total_postings ?? null;

  return (
    <>
      <Header health={health} theme={theme} onToggleTheme={toggle} />
      <FilterBar options={filterOptions} filters={filters} onChange={setFilters} matched={matched} />

      <main className="main">
        <section className="section" id="key-figures">
          <div className="section-head">
            <h2>Key figures</h2>
            <p>Every number on this page reflects the filters above.</p>
          </div>
          <KpiStrip filters={filters} />
        </section>

        {SECTIONS.map((s) => (
          <section className="section" id={s.id} key={s.id}>
            <div className="section-head">
              <h2>{s.title}</h2>
              <p>{s.description}</p>
            </div>
            <div className="grid">
              {s.charts.map((spec) => (
                <ChartCard
                  key={spec.widget}
                  spec={spec}
                  filters={filters}
                  chartTheme={chartTheme}
                  theme={theme}
                />
              ))}
            </div>
          </section>
        ))}
      </main>

      <footer className="footer">
        Data: LinkedIn Job Postings (2023–2024) by Arsh Koneru on Kaggle, CC BY-SA 4.0. Job families are
        inferred from titles with keyword rules and may misclassify unusual titles. Stack: ClickHouse,
        FastAPI, React, ECharts.
      </footer>
    </>
  );
}
