export default function Header({ health, theme, onToggleTheme }) {
  return (
    <header className="header">
      <div>
        <h1>Jobs Market Monitor</h1>
        <p className="subtitle">
          Analytics on {health ? health.postings.toLocaleString("en-US") : "…"} LinkedIn job
          postings from 2023–2024, based on the open{" "}
          <a
            href="https://www.kaggle.com/datasets/arshkon/linkedin-job-postings"
            target="_blank"
            rel="noreferrer"
          >
            Kaggle dataset
          </a>
          . Salaries are normalised to yearly USD.
        </p>
      </div>
      <div className="header-right">
        <div className="status">
          <span className={`status-dot${health ? "" : " down"}`} />
          {health ? `ClickHouse ${health.clickhouse}` : "API unavailable"}
        </div>
        <button type="button" onClick={onToggleTheme} aria-label="Switch colour theme">
          {theme === "dark" ? "Light theme" : "Dark theme"}
        </button>
      </div>
    </header>
  );
}
