// Derivations that power the Contracts "Graph" (analytical lenses) view.
//
// Everything here is derived from data the Contract type already carries — the
// pricing layer, hour-by-hour coverage, temporal validity and cost composition
// are all read out of `type`, `parameters`, `timeWindow` and the start/end dates.
// No volume is modelled, so coverage is *presence*-based, not volume-weighted.

import { DAYS_OF_WEEK, type Contract } from "./types";
import { CONTRACT_TYPES, contractCategory, paramsKindFor } from "./contract-types";

// --- Pricing layer -----------------------------------------------------------

export type PricingLayer = "fixed" | "floating" | "regulated";

// Commodity types whose price is fixed up-front (hedges, PPAs, fixed revenue).
const FIXED_TYPES = new Set<string>([
  "hedge",
  "PPA",
  "virtual PPA",
  "futures hedge",
  "percentual hedge",
  "fixed revenue",
]);

// Commodity types that float with the market (spot family, imbalance, indexed).
const FLOATING_TYPES = new Set<string>([
  "dynamic",
  "variable",
  "spot",
  "imbalance",
  "imbalance cost market baseline",
  "energy revenue",
]);

// Commodity types that ride on top of the energy price rather than pricing a
// given hour's volume — excluded from hourly coverage, kept in cost composition.
const NON_COVERAGE_COMMODITY = new Set<string>([
  "supplier markup",
  "guarantee of origin",
  "market data revenue",
]);

// Classify a contract *type value* into its pricing layer. Type-driven so the
// same logic answers both per-contract questions and "which types are fixed?".
export function layerForType(value: string): PricingLayer {
  if (contractCategory(value) === "Grid & Regulated") return "regulated";
  const kind = paramsKindFor(value);
  if (kind === "fixedHedge" || kind === "ppa") return "fixed";
  if (kind === "dayAheadSpot" || kind === "averageDayAheadSpot") return "floating";
  if (FIXED_TYPES.has(value)) return "fixed";
  if (FLOATING_TYPES.has(value)) return "floating";
  // Unknown commodity contract — assume market exposure (the safer default).
  return "floating";
}

export function pricingLayer(contract: Contract): PricingLayer {
  return layerForType(contract.type);
}

// Types that actually set the energy price for an hour (fixed or floating,
// commodity, and not a markup/certificate). These feed the coverage grid.
export function typePricesEnergy(value: string): boolean {
  if (contractCategory(value) === "Grid & Regulated") return false;
  if (NON_COVERAGE_COMMODITY.has(value)) return false;
  return true;
}

export function pricesEnergy(contract: Contract): boolean {
  return typePricesEnergy(contract.type);
}

// Human-readable labels of the energy-pricing contract types in a layer — used
// by the coverage legend's info tooltips. Stays in sync with the type registry.
export function typeLabelsForLayer(layer: "fixed" | "floating"): string[] {
  return CONTRACT_TYPES.filter(
    (t) => typePricesEnergy(t.value) && layerForType(t.value) === layer,
  ).map((t) => t.label);
}

// --- Cost composition --------------------------------------------------------

export type CostBucket = "commodity" | "grid" | "taxes";

const TAX_TYPES = new Set<string>(["energy tax", "tiered energy tax"]);

export function costBucket(type: string): CostBucket {
  if (TAX_TYPES.has(type)) return "taxes";
  if (contractCategory(type) === "Grid & Regulated") return "grid";
  return "commodity";
}

// Commodity terms (markup, hedge/PPA price, spot offset) are negotiable with the
// supplier; grid fees and taxes are set by the DSO / regulator and are not.
export function isNegotiable(type: string): boolean {
  return costBucket(type) === "commodity";
}

export const COST_BUCKET_LABEL: Record<CostBucket, string> = {
  commodity: "Commodity",
  grid: "Grid & Network",
  taxes: "Taxes & Levies",
};

// --- Temporal validity -------------------------------------------------------

function toUTC(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, (m ?? 1) - 1, d ?? 1);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((toUTC(toIso) - toUTC(fromIso)) / 86_400_000);
}

// Zero-padded ISO dates compare correctly as plain strings. Missing bounds are
// treated as open-ended.
export function isActiveOn(contract: Contract, iso: string): boolean {
  const afterStart = !contract.startDate || contract.startDate <= iso;
  const beforeEnd = !contract.endDate || contract.endDate >= iso;
  return afterStart && beforeEnd;
}

// --- Hourly coverage ---------------------------------------------------------

export type CoverageStatus = "gap" | "floating" | "fixed" | "overlap";

export interface CoverageCell {
  status: CoverageStatus;
  fixed: string[]; // contract names covering this hour with a fixed price
  floating: string[]; // contract names covering this hour with a floating price
}

// Rows are Monday..Sunday to match DAYS_OF_WEEK; columns are hours 0..23.
export type CoverageGrid = CoverageCell[][];

const HOURS = Array.from({ length: 24 }, (_, h) => h);

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

// Does the contract's time window apply to hour `hour` on weekday `dayIndex`
// (0 = Monday)? Treats each hour as the block [hour:00, hour+1:00).
export function windowCoversHour(
  contract: Contract,
  dayIndex: number,
  hour: number,
): boolean {
  const tw = contract.timeWindow;
  if (tw.mode === "always") return true;

  const day = DAYS_OF_WEEK[dayIndex];
  const dayMatches = tw.daysOfWeek.includes(day);
  if (!dayMatches) return false;

  const start = timeToMinutes(tw.startTime);
  // "24:00:00" and empty end mean end-of-day.
  const end = tw.endTime && tw.endTime !== "24:00:00" ? timeToMinutes(tw.endTime) : 1440;
  const blockStart = hour * 60;
  const blockEnd = blockStart + 60;
  const overlaps = start < blockEnd && end > blockStart;

  return tw.rangeInclusion === "Outside" ? !overlaps : overlaps;
}

export function coverageGrid(contracts: Contract[], iso: string): CoverageGrid {
  const active = contracts.filter((c) => pricesEnergy(c) && isActiveOn(c, iso));

  return DAYS_OF_WEEK.map((_, dayIndex) =>
    HOURS.map((hour): CoverageCell => {
      const fixed: string[] = [];
      const floating: string[] = [];
      for (const c of active) {
        if (!windowCoversHour(c, dayIndex, hour)) continue;
        if (pricingLayer(c) === "fixed") fixed.push(c.name);
        else floating.push(c.name);
      }
      let status: CoverageStatus;
      if (fixed.length >= 2) status = "overlap";
      else if (fixed.length === 1) status = "fixed";
      else if (floating.length >= 1) status = "floating";
      else status = "gap";
      return { status, fixed, floating };
    }),
  );
}

export interface CoverageSummary {
  gap: number;
  floating: number;
  fixed: number;
  overlap: number;
  total: number;
}

export function coverageSummary(grid: CoverageGrid): CoverageSummary {
  const s: CoverageSummary = { gap: 0, floating: 0, fixed: 0, overlap: 0, total: 0 };
  for (const row of grid) {
    for (const cell of row) {
      s[cell.status] += 1;
      s.total += 1;
    }
  }
  return s;
}

// --- Expiry analysis (timeline warnings) -------------------------------------

export interface ExpiryInfo {
  contract: Contract;
  daysToExpiry: number;
  layer: PricingLayer;
  // A fixed contract that ends with no other fixed contract active the next day
  // — its window silently falls back to spot / becomes unpriced.
  leavesGap: boolean;
}

function isoAddDays(iso: string, days: number): string {
  const d = new Date(toUTC(iso) + days * 86_400_000);
  return d.toISOString().slice(0, 10);
}

// Contracts active on `iso` that will expire in the future, soonest first.
export function expiryAnalysis(contracts: Contract[], iso: string): ExpiryInfo[] {
  const active = contracts.filter((c) => isActiveOn(c, iso) && c.endDate);

  return active
    .map((contract): ExpiryInfo => {
      const daysToExpiry = daysBetween(iso, contract.endDate);
      const layer = pricingLayer(contract);
      const dayAfter = isoAddDays(contract.endDate, 1);
      const replacement = contracts.some(
        (o) =>
          o.id !== contract.id &&
          pricingLayer(o) === "fixed" &&
          pricesEnergy(o) &&
          isActiveOn(o, dayAfter),
      );
      return {
        contract,
        daysToExpiry,
        layer,
        leavesGap: layer === "fixed" && pricesEnergy(contract) && !replacement,
      };
    })
    .filter((e) => e.daysToExpiry >= 0)
    .sort((a, b) => a.daysToExpiry - b.daysToExpiry);
}
