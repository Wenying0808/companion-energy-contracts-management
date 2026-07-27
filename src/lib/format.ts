import { DAYS_OF_WEEK, type ContractParameters, type ContractTimeWindow } from "./types";

// Human-readable time-window summary for the contracts table.
export function formatTimeWindow(tw: ContractTimeWindow): string {
  if (tw.mode === "always") return "Always";
  if (tw.daysOfWeek.length === 0) return "Custom";
  const allDays = DAYS_OF_WEEK.every((d) => tw.daysOfWeek.includes(d));
  if (allDays) return `${tw.startTime}–${tw.endTime}`;
  return tw.daysOfWeek.join(", ");
}

// Derive the pill text shown in the Parameters column from the typed params.
export function describeParameters(p: ContractParameters): string {
  switch (p.kind) {
    case "dayAheadSpot": {
      const product = p.spotProduct.replace(/\s*-\s*/, " ").trim();
      const scale = p.scaling ? `${p.scaling} * ` : "";
      const constant = p.constant ? ` + ${p.constant}` : "";
      return product ? `${scale}${product}${constant}` : p.constant || "-";
    }
    case "averageDayAheadSpot": {
      const product = p.spotProduct.replace(/\s*-\s*/, " ").trim();
      const scale = p.scaling ? `${p.scaling} * ` : "";
      const constant = p.constant ? ` + ${p.constant}` : "";
      const base = product ? `${scale}avg(${product})${constant}` : p.constant || "-";
      return `${base} (${p.period})`;
    }
    case "accessPower":
      return p.regularCost
        ? `${p.regularCost}${p.accessCapacity ? ` · ${p.accessCapacity} kW` : ""}`
        : "-";
    case "fixedHedge":
      return `${p.price || "-"} (${p.hedgeBasis} hedge)`;
    case "fixedCost":
      return p.costPerYear || "-";
    case "energyTax":
      return p.price || "-";
    case "ppa":
      return `${p.price || "-"} · ${p.ppaType}`;
    case "generic":
      if (p.fields.length === 0) return "-";
      return p.fields
        .slice(0, 2)
        .map((f) => `${f.label}: ${f.value}`)
        .join(", ");
  }
}

// Group column — energy direction when present; Fixed Cost and PPA are always
// Consumption even though those param shapes have no energyDirection field.
export function contractGroup(p: ContractParameters): string {
  if ("energyDirection" in p) return p.energyDirection;
  if (p.kind === "fixedCost" || p.kind === "ppa") return "Consumption";
  return "-";
}

// Volume column — only the hedge carries a unit today.
export function contractVolume(p: ContractParameters): string {
  if (p.kind === "fixedHedge") return `1 ${p.unit}`;
  return "-";
}

export function formatDate(iso: string): string {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}
