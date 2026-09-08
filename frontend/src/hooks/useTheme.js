import { useCallback, useState } from "react";

const KEY = "jobs-dashboard-theme";

function applyTheme(theme) {
  // Ставимо атрибут одразу (не в useEffect), щоб графіки при наступному
  // рендері вже читали нові CSS-змінні.
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(KEY, theme);
  return theme;
}

function initialTheme() {
  const saved = localStorage.getItem(KEY);
  if (saved === "light" || saved === "dark") return applyTheme(saved);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return applyTheme(prefersDark ? "dark" : "light");
}

export function useTheme() {
  const [theme, setTheme] = useState(initialTheme);
  const toggle = useCallback(() => {
    setTheme((t) => applyTheme(t === "dark" ? "light" : "dark"));
  }, []);
  return { theme, toggle };
}

// Кольори для ECharts беремо з CSS-змінних, щоб графіки
// перемикались разом з темою.
export function readChartTheme() {
  const css = getComputedStyle(document.documentElement);
  const v = (name) => css.getPropertyValue(name).trim();
  return {
    text: v("--ink"),
    muted: v("--muted"),
    rule: v("--rule"),
    surface: v("--surface"),
    accent: v("--accent"),
    palette: [
      v("--c1"), v("--c2"), v("--c3"), v("--c4"),
      v("--c5"), v("--c6"), v("--c7"), v("--c8"),
    ],
  };
}
