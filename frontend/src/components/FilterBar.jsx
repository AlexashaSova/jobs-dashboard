import MultiSelect from "./MultiSelect.jsx";
import { fmtMonth } from "../charts/format.js";

export const EMPTY_FILTERS = {
  months: [],
  levels: [],
  work_types: [],
  has_desc: -1,
  has_skills: -1,
};

function TriState({ label, value, onChange }) {
  return (
    <label className="tri">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
        <option value={-1}>Any</option>
        <option value={1}>Yes</option>
        <option value={0}>No</option>
      </select>
    </label>
  );
}

export default function FilterBar({ options, filters, onChange, matched }) {
  const set = (patch) => onChange({ ...filters, ...patch });
  const isDefault = JSON.stringify(filters) === JSON.stringify(EMPTY_FILTERS);

  return (
    <div className="filters" role="region" aria-label="Filters">
      <span className="filters-label">Show postings:</span>
      <MultiSelect
        label="Months"
        options={options?.months ?? []}
        selected={filters.months}
        onChange={(v) => set({ months: v })}
        formatValue={fmtMonth}
      />
      <MultiSelect
        label="Experience levels"
        options={options?.levels ?? []}
        selected={filters.levels}
        onChange={(v) => set({ levels: v })}
      />
      <MultiSelect
        label="Job types"
        options={options?.work_types ?? []}
        selected={filters.work_types}
        onChange={(v) => set({ work_types: v })}
      />
      <TriState
        label="Has description"
        value={filters.has_desc}
        onChange={(v) => set({ has_desc: v })}
      />
      <TriState
        label="Lists requirements"
        value={filters.has_skills}
        onChange={(v) => set({ has_skills: v })}
      />
      {matched != null && (
        <span className="count">{matched.toLocaleString("en-US")} postings match</span>
      )}
      <button
        type="button"
        className="reset"
        disabled={isDefault}
        onClick={() => onChange(EMPTY_FILTERS)}
      >
        Reset filters
      </button>
    </div>
  );
}
