import { DAYS_OF_WEEK, type Contract } from "./types";

// Human-readable time-window summary for the contracts table ("Always" vs a
// weekday/time range).
export function formatTimeWindow(c: Contract): string {
  const allDays = DAYS_OF_WEEK.every((d) => c.timeWindow.daysOfWeek.includes(d));
  const fullDay =
    c.timeWindow.startTime === "00:00:00" &&
    (c.timeWindow.endTime === "23:59:59" || c.timeWindow.endTime === "24:00:00");
  if (allDays && fullDay) return "Always";
  if (c.timeWindow.daysOfWeek.length === 0) return "Always";
  return c.timeWindow.daysOfWeek.join(", ");
}

// Derive the pill text shown in the Parameters column from the financial fields.
export function formatParameters(f: {
  spotProduct: string;
  constant: string;
  scaling: string;
}): string {
  const hasSpot = f.spotProduct && f.spotProduct !== "-";
  if (hasSpot) {
    const product = f.spotProduct.replace(/\s*-\s*/, " ");
    return `${f.scaling} * ${product} + ${f.constant}`;
  }
  return f.constant || "-";
}

export function formatDate(iso: string): string {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}
