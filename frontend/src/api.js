// Усі звернення до бекенду зібрані тут.
// Адреси відносні (/api/...): у dev їх проксіює Vite,
// у production фронтенд віддає сам FastAPI.

export function buildQuery(filters) {
  const params = new URLSearchParams();
  for (const m of filters.months) params.append("months", m);
  for (const l of filters.levels) params.append("levels", l);
  for (const w of filters.work_types) params.append("work_types", w);
  if (filters.has_desc !== -1) params.set("has_desc", filters.has_desc);
  if (filters.has_skills !== -1) params.set("has_skills", filters.has_skills);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

async function getJson(url, signal) {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch {
      // тіло не JSON — лишаємо statusText
    }
    throw new Error(`${res.status}: ${detail}`);
  }
  return res.json();
}

export const api = {
  health: (signal) => getJson("/api/health", signal),
  filters: (signal) => getJson("/api/filters", signal),
  widget: (name, filters, signal) =>
    getJson(`/api/widgets/${name}${buildQuery(filters)}`, signal),
};
