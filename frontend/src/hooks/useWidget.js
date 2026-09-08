import { useEffect, useState } from "react";
import { api } from "../api.js";

// Завантажує дані одного віджета і перезавантажує при зміні фільтрів.
// AbortController скасовує попередній запит, якщо фільтри змінились
// швидше, ніж прийшла відповідь.
export function useWidget(name, filters) {
  const [state, setState] = useState({ rows: null, error: null, loading: true });

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));

    api
      .widget(name, filters, controller.signal)
      .then((data) => setState({ rows: data.rows, error: null, loading: false }))
      .catch((err) => {
        if (err.name === "AbortError") return;
        setState({ rows: null, error: err.message, loading: false });
      });

    return () => controller.abort();
  }, [name, filters]);

  return state;
}
