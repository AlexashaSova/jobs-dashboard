export const fmtInt = (v) => Math.round(v).toLocaleString("en-US");
export const fmtPct = (v) => `${Number(v).toFixed(1)}%`;
export const fmtMoney = (v) => `$${Math.round(v).toLocaleString("en-US")}`;
export const fmtMoneyK = (v) => `$${Math.round(v / 1000)}k`;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtMonth(key) {
  // "2024-04" -> "Apr 2024"
  const [y, m] = key.split("-");
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

export function fmtWeek(dateStr) {
  // "2024-01-07" -> "7 Jan"
  const d = new Date(dateStr);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}
