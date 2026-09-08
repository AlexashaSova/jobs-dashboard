import { axisStyle, base, donut, hbar, legend } from "./common.js";
import { fmtInt, fmtMoney, fmtMoneyK, fmtMonth, fmtPct, fmtWeek } from "./format.js";

// Один запис на віджет: який ендпоінт, як називати, як малювати.
// build(rows, theme) -> option для ECharts.
// span — ширина панелі у 12-колонковій сітці.

const money = (v) => (v == null ? "n/a" : fmtMoney(v));

// ---------- Overview ----------

export const postingsByMonth = {
  widget: "postings_by_month",
  title: "Postings, remote share and median salary by month",
  subtitle: "Bars show the number of postings; lines are read against the right axis.",
  span: 12,
  tall: true,
  build: (rows, t) => ({
    ...base(t),
    legend: legend(t),
    grid: { left: 8, right: 8, top: 40, bottom: 8, containLabel: true },
    tooltip: {
      ...base(t).tooltip,
      trigger: "axis",
      formatter: (ps) => {
        const r = rows[ps[0].dataIndex];
        return `<b>${fmtMonth(r.month)}</b><br/>${fmtInt(r.postings)} postings<br/>` +
          `${fmtPct(r.remote_pct)} remote<br/>Median salary ${money(r.median_salary)}<br/>` +
          `${r.avg_applies} applications per posting`;
      },
    },
    xAxis: { type: "category", data: rows.map((r) => fmtMonth(r.month)), ...axisStyle(t, { splitLine: { show: false } }) },
    yAxis: [
      { type: "value", ...axisStyle(t), axisLabel: { color: t.muted, formatter: fmtInt } },
      { type: "value", name: "% / $k", nameTextStyle: { color: t.muted, align: "right" }, ...axisStyle(t, { splitLine: { show: false } }), axisLabel: { color: t.muted } },
    ],
    series: [
      { name: "Postings", type: "bar", data: rows.map((r) => r.postings), barMaxWidth: 48, itemStyle: { color: t.palette[0] } },
      { name: "Remote %", type: "line", yAxisIndex: 1, data: rows.map((r) => r.remote_pct), smooth: false, symbolSize: 6, itemStyle: { color: t.palette[1] } },
      { name: "Median salary ($k)", type: "line", yAxisIndex: 1, data: rows.map((r) => (r.median_salary == null ? null : Math.round(r.median_salary / 1000))), symbolSize: 6, itemStyle: { color: t.palette[4] } },
    ],
  }),
};

export const postingsByWeek = {
  widget: "postings_by_week",
  title: "Weekly volume",
  subtitle: "New postings per week, with the remote-friendly subset.",
  span: 12,
  build: (rows, t) => ({
    ...base(t),
    legend: legend(t),
    tooltip: { ...base(t).tooltip, trigger: "axis" },
    xAxis: { type: "category", data: rows.map((r) => fmtWeek(r.week)), ...axisStyle(t, { splitLine: { show: false } }), boundaryGap: false },
    yAxis: { type: "value", ...axisStyle(t), axisLabel: { color: t.muted, formatter: fmtInt } },
    series: [
      { name: "All postings", type: "line", data: rows.map((r) => r.postings), areaStyle: { opacity: 0.08 }, symbol: "none", lineStyle: { width: 2 } },
      { name: "Remote-friendly", type: "line", data: rows.map((r) => r.remote_postings), symbol: "none", lineStyle: { width: 2 } },
    ],
  }),
};

// ---------- What jobs are out there ----------

export const roleFamily = {
  widget: "role_family",
  title: "Job families",
  subtitle: "Derived from the job title. Area is the number of postings.",
  span: 8,
  tall: true,
  build: (rows, t) => ({
    ...base(t),
    tooltip: {
      ...base(t).tooltip,
      formatter: (p) => {
        const r = p.data.row;
        return `<b>${r.role_family}</b><br/>${fmtInt(r.postings)} postings (${fmtPct(r.share_pct)})<br/>` +
          `Median salary ${money(r.median_salary)}<br/>${fmtPct(r.remote_pct)} remote`;
      },
    },
    series: [
      {
        type: "treemap",
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        width: "100%",
        height: "100%",
        top: 0, left: 0,
        label: { fontSize: 12, color: t.surface, formatter: (p) => (p.data?.row ? `${p.name}\n${fmtPct(p.data.row.share_pct)}` : "") },
        itemStyle: { borderColor: t.surface, borderWidth: 2, gapWidth: 2 },
        colorMappingBy: "index",
        levels: [{ color: t.palette }],
        data: rows.map((r) => ({ name: r.role_family, value: r.postings, row: r })),
      },
    ],
  }),
};

export const topTitles = {
  widget: "top_titles",
  title: "Most common job titles",
  span: 4,
  tall: true,
  build: (rows, t) => hbar(t, rows.slice(0, 15), {
    cat: "title", val: "postings",
    tooltipExtra: (r) => `<br/>Median salary ${money(r.median_salary)}<br/>${fmtPct(r.remote_pct)} remote`,
  }),
};

export const expLevelSplit = {
  widget: "exp_level_split",
  title: "Experience level",
  span: 4,
  build: (rows, t) => donut(t, rows, { cat: "exp_level", val: "postings", extraLine: (r) => `Median salary ${money(r.median_salary)}` }),
};

export const workTypeSplit = {
  widget: "work_type_split",
  title: "Job type",
  span: 4,
  build: (rows, t) => donut(t, rows, { cat: "work_type", val: "postings", extraLine: (r) => `Median salary ${money(r.median_salary)}` }),
};

export const remoteByLevel = {
  widget: "remote_by_level",
  title: "Remote vs on-site by experience level",
  subtitle: "Share of postings that allow remote work.",
  span: 4,
  build: (rows, t) => ({
    ...base(t),
    legend: legend(t),
    grid: { left: 8, right: 16, top: 32, bottom: 8, containLabel: true },
    tooltip: { ...base(t).tooltip, trigger: "axis", axisPointer: { type: "shadow" }, valueFormatter: (v) => `${fmtPct(v)}` },
    xAxis: { type: "value", max: 100, ...axisStyle(t), axisLabel: { color: t.muted, formatter: (v) => `${v}%` } },
    yAxis: { type: "category", data: rows.map((r) => r.exp_level), ...axisStyle(t, { splitLine: { show: false } }), axisLabel: { color: t.text, fontSize: 11 } },
    series: [
      { name: "Remote", type: "bar", stack: "s", data: rows.map((r) => r.remote_pct), itemStyle: { color: t.palette[1] }, barMaxWidth: 22 },
      { name: "On-site", type: "bar", stack: "s", data: rows.map((r) => +(100 - r.remote_pct).toFixed(1)), itemStyle: { color: t.palette[2] }, barMaxWidth: 22 },
    ],
  }),
};

// ---------- Salaries ----------

function salaryBox(rows, t, cat, { low = "p25", high = "p75", whiskerLow, whiskerHigh } = {}) {
  const data = rows.map((r) => [
    r[whiskerLow ?? low], r[low], r.median, r[high], r[whiskerHigh ?? high],
  ]);
  return {
    ...base(t),
    grid: { left: 8, right: 16, top: 12, bottom: 8, containLabel: true },
    tooltip: {
      ...base(t).tooltip,
      formatter: (p) => {
        const r = rows[p.dataIndex];
        const w = whiskerLow ? `${fmtMoneyK(r[whiskerLow])} – ${fmtMoneyK(r[whiskerHigh])} (10th–90th pct)<br/>` : "";
        return `<b>${r[cat]}</b><br/>${w}${fmtMoneyK(r[low])} – ${fmtMoneyK(r[high])} (25th–75th pct)<br/>` +
          `Median <b>${fmtMoney(r.median)}</b><br/>${fmtInt(r.postings)} postings with salary`;
      },
    },
    xAxis: { type: "value", ...axisStyle(t), axisLabel: { color: t.muted, formatter: fmtMoneyK } },
    yAxis: { type: "category", data: rows.map((r) => r[cat]), inverse: true, ...axisStyle(t, { splitLine: { show: false } }), axisLabel: { color: t.text, fontSize: 11, width: 150, overflow: "truncate" } },
    series: [
      {
        type: "boxplot",
        data,
        boxWidth: [8, 18],
        itemStyle: { color: t.palette[0] + "33", borderColor: t.palette[0], borderWidth: 1.5 },
      },
    ],
  };
}

export const salaryByLevel = {
  widget: "salary_by_level",
  title: "Salary range by experience level",
  subtitle: "Box: 25th–75th percentile, line: median, whiskers: 10th–90th.",
  span: 6,
  build: (rows, t) => salaryBox(rows, t, "exp_level", { whiskerLow: "p10", whiskerHigh: "p90" }),
};

export const salaryByRoleFamily = {
  widget: "salary_by_role_family",
  title: "Salary range by job family",
  subtitle: "Box: 25th–75th percentile, line: median. Families with 30+ salaried postings.",
  span: 6,
  tall: true,
  build: (rows, t) => salaryBox(rows, t, "role_family"),
};

export const salaryHistogram = {
  widget: "salary_histogram",
  title: "Salary distribution",
  subtitle: "Postings by yearly salary, in $20k steps (up to $400k).",
  span: 6,
  build: (rows, t) => ({
    ...base(t),
    tooltip: {
      ...base(t).tooltip, trigger: "axis", axisPointer: { type: "shadow" },
      formatter: (ps) => { const r = rows[ps[0].dataIndex]; return `${fmtMoneyK(r.bucket_from)} – ${fmtMoneyK(r.bucket_to)}<br/><b>${fmtInt(r.postings)}</b> postings`; },
    },
    xAxis: { type: "category", data: rows.map((r) => fmtMoneyK(r.bucket_from)), ...axisStyle(t, { splitLine: { show: false } }) },
    yAxis: { type: "value", ...axisStyle(t), axisLabel: { color: t.muted, formatter: fmtInt } },
    series: [{ type: "bar", data: rows.map((r) => r.postings), barCategoryGap: "10%", itemStyle: { color: t.palette[0] } }],
  }),
};

export const salaryByState = {
  widget: "salary_by_state",
  title: "Where salaries are highest",
  subtitle: "Median yearly salary by state, 50+ salaried postings.",
  span: 6,
  build: (rows, t) => {
    const data = rows.slice(0, 15);
    return {
      ...hbar(t, data, { cat: "state", val: "median_salary", valueFmt: fmtMoneyK, color: t.palette[4] }),
      tooltip: {
        ...base(t).tooltip, trigger: "axis", axisPointer: { type: "shadow" },
        formatter: (ps) => { const r = [...data].reverse()[ps[0].dataIndex]; return `<b>${r.state}</b><br/>Median ${fmtMoney(r.median_salary)}<br/>${fmtInt(r.postings)} salaried postings`; },
      },
    };
  },
};

// ---------- Skills & industries ----------

export const topSkills = {
  widget: "top_skills",
  title: "Most requested skills",
  subtitle: "LinkedIn skill categories attached to postings.",
  span: 4,
  tall: true,
  build: (rows, t) => hbar(t, rows, { cat: "skill", val: "postings", tooltipExtra: (r) => `<br/>Median salary ${money(r.median_salary)}<br/>${fmtPct(r.remote_pct)} remote` }),
};

export const skillsByLevel = {
  widget: "skills_by_level",
  title: "Skills by experience level",
  subtitle: "Top skills, split by the level the posting asks for. Darker means more postings.",
  span: 8,
  tall: true,
  build: (rows, t) => {
    const skills = [...new Set(rows.map((r) => r.skill))];
    const levels = [...new Set(rows.map((r) => r.exp_level))];
    const max = Math.max(...rows.map((r) => r.postings));
    return {
      ...base(t),
      grid: { left: 8, right: 16, top: 8, bottom: 60, containLabel: true },
      tooltip: { ...base(t).tooltip, formatter: (p) => `<b>${skills[p.value[1]]}</b> · ${levels[p.value[0]]}<br/>${fmtInt(p.value[2])} postings` },
      xAxis: { type: "category", data: levels, position: "bottom", ...axisStyle(t, { splitLine: { show: false } }), axisLabel: { color: t.text, fontSize: 11, interval: 0, rotate: 20 } },
      yAxis: { type: "category", data: skills, inverse: true, ...axisStyle(t, { splitLine: { show: false } }), axisLabel: { color: t.text, fontSize: 11, width: 150, overflow: "truncate" } },
      visualMap: { min: 0, max, show: false, inRange: { color: [t.surface, t.palette[0]] } },
      series: [{
        type: "heatmap",
        data: rows.map((r) => ({
          value: [levels.indexOf(r.exp_level), skills.indexOf(r.skill), r.postings],
          label: { color: r.postings > max * 0.55 ? "#ffffff" : t.text },
        })),
        itemStyle: { borderColor: t.rule, borderWidth: 1 },
        label: { show: true, fontSize: 10, formatter: (p) => fmtInt(p.value[2]) },
        emphasis: { itemStyle: { borderColor: t.text } },
      }],
    };
  },
};

export const topIndustries = {
  widget: "top_industries",
  title: "Industries hiring the most",
  span: 6,
  tall: true,
  build: (rows, t) => hbar(t, rows, { cat: "industry", val: "postings", tooltipExtra: (r) => `<br/>Median salary ${money(r.median_salary)}<br/>${fmtPct(r.remote_pct)} remote` }),
};

export const topBenefits = {
  widget: "top_benefits",
  title: "Benefits mentioned most often",
  subtitle: "Share of all matching postings that list the benefit.",
  span: 6,
  tall: true,
  build: (rows, t) => hbar(t, rows, { cat: "benefit", val: "share_pct", valueFmt: fmtPct, color: t.palette[1], tooltipExtra: (r) => `<br/>${fmtInt(r.postings)} postings` }),
};

// ---------- Employers ----------

function CompaniesTable({ rows }) {
  const max = Math.max(...rows.map((r) => r.postings));
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "auto" }}>
      <table className="table">
        <thead>
          <tr>
            <th>Company</th>
            <th>Size</th>
            <th className="num">Postings</th>
            <th className="num">Median salary</th>
            <th className="num">Remote</th>
            <th className="num">Applications / posting</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.company}>
              <td>{r.company}</td>
              <td>{r.company_size}</td>
              <td className="num">
                <span className="bar" style={{ width: `${(r.postings / max) * 60}px` }} />
                {fmtInt(r.postings)}
              </td>
              <td className="num">{money(r.median_salary)}</td>
              <td className="num">{fmtPct(r.remote_pct)}</td>
              <td className="num">{r.avg_applies}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const topCompanies = {
  widget: "top_companies",
  title: "Top hiring companies",
  span: 8,
  tall: true,
  render: CompaniesTable,
  build: () => null,
};

export const companySize = {
  widget: "company_size",
  title: "Who is hiring: company size",
  subtitle: "Employees, per LinkedIn.",
  span: 4,
  tall: true,
  build: (rows, t) => ({
    ...base(t),
    grid: { left: 8, right: 8, top: 12, bottom: 8, containLabel: true },
    tooltip: {
      ...base(t).tooltip, trigger: "axis", axisPointer: { type: "shadow" },
      formatter: (ps) => { const r = rows[ps[0].dataIndex]; return `<b>${r.company_size}</b><br/>${fmtInt(r.postings)} postings<br/>Median salary ${money(r.median_salary)}<br/>${fmtPct(r.remote_pct)} remote`; },
    },
    xAxis: { type: "category", data: rows.map((r) => r.company_size), ...axisStyle(t, { splitLine: { show: false } }), axisLabel: { color: t.muted, fontSize: 10, interval: 0, rotate: 30 } },
    yAxis: { type: "value", ...axisStyle(t), axisLabel: { color: t.muted, formatter: fmtInt } },
    series: [{ type: "bar", data: rows.map((r) => r.postings), barMaxWidth: 28, itemStyle: { color: t.palette[3] } }],
  }),
};

export const byState = {
  widget: "by_state",
  title: "Postings by state",
  span: 6,
  tall: true,
  build: (rows, t) => hbar(t, rows.slice(0, 15), { cat: "state", val: "postings", tooltipExtra: (r) => `<br/>${fmtPct(r.remote_pct)} remote` }),
};

export const applicationType = {
  widget: "application_type",
  title: "How candidates apply",
  subtitle: "Application flow used by the posting.",
  span: 6,
  tall: true,
  build: (rows, t) => donut(t, rows.map((r) => ({ ...r, label: r.application_type.replace(/([A-Z])/g, " $1").trim() })), {
    cat: "label", val: "postings",
    extraLine: (r) => `${r.avg_applies} applications per posting · ${fmtPct(r.sponsored_pct)} sponsored`,
  }),
};

// ---------- Posting quality & dynamics ----------

export const descriptionQuality = {
  widget: "description_quality",
  title: "How complete are the postings",
  subtitle: "Share with a description and with listed requirements, by experience level.",
  span: 6,
  build: (rows, t) => ({
    ...base(t),
    legend: legend(t),
    grid: { left: 8, right: 8, top: 36, bottom: 8, containLabel: true },
    tooltip: { ...base(t).tooltip, trigger: "axis", axisPointer: { type: "shadow" } },
    xAxis: { type: "category", data: rows.map((r) => r.exp_level), ...axisStyle(t, { splitLine: { show: false } }), axisLabel: { color: t.text, fontSize: 11, interval: 0, rotate: 20 } },
    yAxis: [
      { type: "value", max: 100, ...axisStyle(t), axisLabel: { color: t.muted, formatter: (v) => `${v}%` } },
      { type: "value", ...axisStyle(t, { splitLine: { show: false } }), axisLabel: { color: t.muted, formatter: fmtInt }, name: "chars", nameTextStyle: { color: t.muted } },
    ],
    series: [
      { name: "Has description", type: "bar", data: rows.map((r) => r.with_description_pct), barMaxWidth: 22, itemStyle: { color: t.palette[0] }, tooltip: { valueFormatter: fmtPct } },
      { name: "Lists requirements", type: "bar", data: rows.map((r) => r.with_skills_desc_pct), barMaxWidth: 22, itemStyle: { color: t.palette[1] }, tooltip: { valueFormatter: fmtPct } },
      { name: "Avg description length", type: "line", yAxisIndex: 1, data: rows.map((r) => r.avg_desc_len), symbolSize: 6, itemStyle: { color: t.palette[4] }, tooltip: { valueFormatter: (v) => `${fmtInt(v)} chars` } },
    ],
  }),
};

export const descLenVsApplies = {
  widget: "desc_len_vs_applies",
  title: "Does a longer description attract more applicants?",
  subtitle: "Average applications and views per posting, by description length.",
  span: 6,
  build: (rows, t) => ({
    ...base(t),
    legend: legend(t),
    grid: { left: 8, right: 8, top: 36, bottom: 8, containLabel: true },
    tooltip: { ...base(t).tooltip, trigger: "axis", formatter: (ps) => { const r = rows[ps[0].dataIndex]; return `${fmtInt(r.desc_len_from)}${r.desc_len_from >= 6000 ? "+" : "–" + fmtInt(r.desc_len_from + 500)} chars<br/>${r.avg_applies} applications · ${fmtInt(r.avg_views)} views<br/>${fmtInt(r.postings)} postings`; } },
    xAxis: { type: "category", data: rows.map((r) => (r.desc_len_from >= 6000 ? "6k+" : `${r.desc_len_from / 1000}k`)), ...axisStyle(t, { splitLine: { show: false } }), name: "description length", nameLocation: "middle", nameGap: 26, nameTextStyle: { color: t.muted } },
    yAxis: [
      { type: "value", ...axisStyle(t), axisLabel: { color: t.muted }, name: "applications", nameTextStyle: { color: t.muted } },
      { type: "value", ...axisStyle(t, { splitLine: { show: false } }), axisLabel: { color: t.muted, formatter: fmtInt }, name: "views", nameTextStyle: { color: t.muted } },
    ],
    series: [
      { name: "Applications per posting", type: "line", data: rows.map((r) => r.avg_applies), symbolSize: 6, lineStyle: { width: 2 } },
      { name: "Views per posting", type: "line", yAxisIndex: 1, data: rows.map((r) => r.avg_views), symbolSize: 6, lineStyle: { width: 2, type: "dashed" } },
    ],
  }),
};

export const demandVsInterest = {
  widget: "demand_vs_interest",
  title: "Demand vs competition",
  subtitle: "Right: many openings. Up: many applicants per opening. Bubble size: median salary.",
  span: 8,
  tall: true,
  build: (rows, t) => {
    const salaries = rows.map((r) => r.median_salary ?? 0);
    const sMin = Math.min(...salaries), sMax = Math.max(...salaries);
    const size = (s) => (s == null || sMax === sMin ? 18 : 12 + ((s - sMin) / (sMax - sMin)) * 34);
    return {
      ...base(t),
      grid: { left: 8, right: 24, top: 24, bottom: 8, containLabel: true },
      tooltip: { ...base(t).tooltip, formatter: (p) => { const r = p.data.row; return `<b>${r.role_family}</b><br/>${fmtInt(r.postings)} postings<br/>${r.avg_applies} applications per posting<br/>Median salary ${money(r.median_salary)}<br/>${fmtPct(r.remote_pct)} remote`; } },
      xAxis: { type: "log", name: "postings", nameLocation: "middle", nameGap: 28, nameTextStyle: { color: t.muted }, ...axisStyle(t), axisLabel: { color: t.muted, formatter: fmtInt } },
      yAxis: { type: "value", name: "applications per posting", nameTextStyle: { color: t.muted }, ...axisStyle(t), axisLabel: { color: t.muted } },
      series: [{
        type: "scatter",
        data: rows.map((r) => ({ value: [r.postings, r.avg_applies], symbolSize: size(r.median_salary), row: r })),
        itemStyle: { color: t.palette[0], opacity: 0.75 },
        label: { show: true, position: "right", color: t.text, fontSize: 11, formatter: (p) => p.data.row.role_family },
        labelLayout: { hideOverlap: true },
      }],
    };
  },
};

export const daysActive = {
  widget: "days_active",
  title: "How long postings stay open",
  subtitle: "Median days from listing to expiry, by job family.",
  span: 4,
  tall: true,
  build: (rows, t) => hbar(t, [...rows].sort((a, b) => b.median_days - a.median_days), {
    cat: "role_family", val: "median_days", valueFmt: (v) => `${fmtInt(v)} d`, color: t.palette[2],
    tooltipExtra: (r) => `<br/>${fmtInt(r.p25_days)}–${fmtInt(r.p75_days)} days (25th–75th pct)<br/>${fmtInt(r.postings)} postings`,
  }),
};

// ---------- Розділи дашборду ----------

export const SECTIONS = [
  {
    id: "overview",
    title: "Overview",
    description: "How the market moved across the period covered by the dataset.",
    charts: [postingsByMonth, postingsByWeek],
  },
  {
    id: "jobs",
    title: "What is being hired",
    description: "Which kinds of roles, at which level, and under what terms.",
    charts: [roleFamily, topTitles, expLevelSplit, workTypeSplit, remoteByLevel],
  },
  {
    id: "salaries",
    title: "Salaries",
    description: "Only postings that disclose pay, normalised to yearly USD. Hourly, weekly and monthly figures are converted.",
    charts: [salaryByLevel, salaryHistogram, salaryByRoleFamily, salaryByState],
  },
  {
    id: "skills",
    title: "Skills, industries and benefits",
    description: "What employers ask for and what they offer in return.",
    charts: [topSkills, skillsByLevel, topIndustries, topBenefits],
  },
  {
    id: "employers",
    title: "Employers and geography",
    description: "Who posts the most, how large they are, and where the jobs are.",
    charts: [topCompanies, companySize, byState, applicationType],
  },
  {
    id: "quality",
    title: "Posting quality and dynamics",
    description: "How well postings are written, how long they stay open, and where competition is toughest.",
    charts: [descriptionQuality, descLenVsApplies, demandVsInterest, daysActive],
  },
];
