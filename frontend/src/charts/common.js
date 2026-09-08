import { fmtInt, fmtMoney, fmtPct } from "./format.js";

// Спільні шматки option'ів, щоб усі графіки виглядали однаково.

export function base(t) {
  return {
    color: t.palette,
    textStyle: { fontFamily: "IBM Plex Sans, system-ui, sans-serif", color: t.text },
    animationDuration: 300,
    tooltip: {
      backgroundColor: t.surface,
      borderColor: t.rule,
      textStyle: { color: t.text, fontSize: 12 },
      confine: true,
    },
    grid: { left: 8, right: 16, top: 28, bottom: 8, containLabel: true },
  };
}

export function axisStyle(t, extra = {}) {
  return {
    axisLine: { lineStyle: { color: t.rule } },
    axisTick: { show: false },
    axisLabel: { color: t.muted, fontSize: 11 },
    splitLine: { lineStyle: { color: t.rule } },
    ...extra,
  };
}

export function legend(t, extra = {}) {
  return {
    top: 0,
    left: 0,
    icon: "rect",
    itemWidth: 10,
    itemHeight: 10,
    textStyle: { color: t.muted, fontSize: 11 },
    ...extra,
  };
}

// Горизонтальні бари "категорія -> кількість", найбільше зверху.
export function hbar(t, rows, { cat, val, tooltipExtra, color, valueFmt = fmtInt }) {
  const data = [...rows].reverse();
  return {
    ...base(t),
    grid: { left: 8, right: 48, top: 8, bottom: 8, containLabel: true },
    tooltip: {
      ...base(t).tooltip,
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params) => {
        const p = params[0];
        const row = data[p.dataIndex];
        const extra = tooltipExtra ? tooltipExtra(row) : "";
        return `<b>${row[cat]}</b><br/>${valueFmt(row[val])} postings${extra}`;
      },
    },
    xAxis: { type: "value", ...axisStyle(t), axisLabel: { color: t.muted, fontSize: 11, formatter: fmtInt } },
    yAxis: {
      type: "category",
      data: data.map((r) => r[cat]),
      ...axisStyle(t, { splitLine: { show: false } }),
      axisLabel: { color: t.text, fontSize: 11, width: 140, overflow: "truncate" },
    },
    series: [
      {
        type: "bar",
        data: data.map((r) => r[val]),
        barMaxWidth: 18,
        itemStyle: { color: color ?? t.palette[0] },
        label: { show: true, position: "right", color: t.muted, fontSize: 11, formatter: (p) => valueFmt(p.value) },
      },
    ],
  };
}

export function donut(t, rows, { cat, val, extraLine }) {
  return {
    ...base(t),
    tooltip: {
      ...base(t).tooltip,
      formatter: (p) => {
        const row = rows[p.dataIndex];
        const extra = extraLine ? `<br/>${extraLine(row)}` : "";
        return `<b>${p.name}</b><br/>${fmtInt(p.value)} postings (${p.percent}%)${extra}`;
      },
    },
    legend: legend(t, { orient: "vertical", right: 0, top: "middle", left: "auto" }),
    series: [
      {
        type: "pie",
        radius: ["55%", "80%"],
        center: ["35%", "50%"],
        avoidLabelOverlap: true,
        label: { show: false },
        itemStyle: { borderColor: t.surface, borderWidth: 2 },
        data: rows.map((r) => ({ name: r[cat], value: r[val] })),
      },
    ],
  };
}

export const fmt = { int: fmtInt, money: fmtMoney, pct: fmtPct };
