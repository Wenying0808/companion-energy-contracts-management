// Mock volume model + volume-weighted coverage derivation.
//
// The coverage grid (coverage.ts) is presence-based — it answers "does a
// contract price this hour?" but not "how many MW does it actually cover?".
// This module layers an *illustrative* hourly consumption profile and a
// per-contract nominal volume on top, so overlaps (over-hedging) and gaps
// (open, uncovered load) become visible in MW. No schema change: the volume
// lives here as a seed map keyed by contract id, with deterministic fallbacks
// for runtime-added / AI-extracted contracts.

import type { Contract } from "./types";
import {
  isActiveOn,
  pricesEnergy,
  pricingLayer,
  windowCoversHour,
  type PricingLayer,
} from "./coverage";

const HOURS = Array.from({ length: 24 }, (_, h) => h);

// --- Consumption profile -----------------------------------------------------

// A weekday load shape (MW per hour, 00:00..23:00): low overnight base, morning
// ramp, a midday peak ~14 MW, tapering through the evening. Weekends reuse the
// same shape scaled down and flattened.
const WEEKDAY_MW = [
  5.0, 4.5, 4.2, 4.3, 4.8, 5.5, 7.0, 9.0, 11.0, 12.5, 13.5, 14.0, 14.0, 13.8,
  13.0, 11.5, 10.5, 9.5, 8.5, 7.5, 7.0, 6.5, 6.0, 5.5,
];
const WEEKEND_SCALE = 0.7;

// 7×24 (Monday-first, matching DAYS_OF_WEEK / coverageGrid); Sat/Sun scaled.
export const WEEKLY_CONSUMPTION_MW: number[][] = [0, 1, 2, 3, 4, 5, 6].map(
  (dayIndex) =>
    WEEKDAY_MW.map((mw) =>
      dayIndex >= 5 ? Math.round(mw * WEEKEND_SCALE * 10) / 10 : mw,
    ),
);

// Monday=0 … Sunday=6 for an ISO date (getUTCDay is Sunday=0).
export function weekdayIndex(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const day = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1)).getUTCDay();
  return (day + 6) % 7;
}

// --- Per-contract nominal volume ---------------------------------------------

// Flat blocks (MW) for fixed hedges, keyed by seed id; other fixed contracts
// fall back to DEFAULT_FLAT_MW so the chart still renders for new contracts.
const FLAT_MW: Record<string, number> = {
  "seed-hedge-a": 6, // Peak Fixed Hedge
  "seed-hedge-b": 5, // Core Fixed Hedge (overlaps Peak midday → over-hedge story)
};
const DEFAULT_FLAT_MW = 3;

// PPAs follow a solar production bell rather than a flat block.
const PPA_PEAK_MW: Record<string, number> = {
  "seed-ppa": 3.5, // Solar PPA
};
const DEFAULT_PPA_PEAK_MW = 3;

// Normalised solar production (fraction of peak) by hour of day.
const SOLAR_SHAPE = [
  0, 0, 0, 0, 0, 0, 0, 0, 0.15, 0.34, 0.57, 0.8, 0.94, 1.0, 0.94, 0.74, 0.49,
  0.23, 0.05, 0, 0, 0, 0, 0,
];

// The MW a *fixed-layer* contract offers in a given hour. Floating contracts
// return 0 here — they fill whatever load the fixed layer leaves uncovered.
// Callers still gate on windowCoversHour, so this need only shape the volume.
export function contractNominalMw(contract: Contract, hour: number): number {
  if (pricingLayer(contract) !== "fixed") return 0;
  if (contract.parameters.kind === "ppa") {
    const peak = PPA_PEAK_MW[contract.id] ?? DEFAULT_PPA_PEAK_MW;
    return Math.round(peak * (SOLAR_SHAPE[hour] ?? 0) * 10) / 10;
  }
  return FLAT_MW[contract.id] ?? DEFAULT_FLAT_MW;
}

// --- Volume-weighted breakdown -----------------------------------------------

export interface HourVolume {
  hour: number;
  hourLabel: string; // "00:00"
  consumption: number;
  bands: Record<string, number>; // contractId → MW covered this hour
  uncovered: number; // MW of load no contract covers
  overHedge: number; // MW of fixed volume above consumption
}

export interface VolumeContract {
  id: string;
  name: string;
  layer: PricingLayer;
}

export interface VolumeBreakdown {
  hours: HourVolume[];
  // Contracts appearing on this day, ordered for stacking/legend: fixed first
  // (bottom of the stack), then floating.
  contracts: VolumeContract[];
}

const pad = (h: number) => `${String(h).padStart(2, "0")}:00`;

// Energy-pricing contracts active on a date, ordered fixed→floating (then by
// id) — a *day-independent* order so each contract keeps a stable colour as the
// day picker changes.
export function energyContractsForDate(
  contracts: Contract[],
  iso: string,
): VolumeContract[] {
  return contracts
    .filter((c) => pricesEnergy(c) && isActiveOn(c, iso))
    .map((c) => ({ id: c.id, name: c.name, layer: pricingLayer(c) }))
    .sort((a, b) => {
      if (a.layer !== b.layer) return a.layer === "fixed" ? -1 : 1;
      return a.id.localeCompare(b.id);
    });
}

export function hourlyVolumeBreakdown(
  contracts: Contract[],
  iso: string,
  dayIndex: number,
): VolumeBreakdown {
  const active = contracts.filter((c) => pricesEnergy(c) && isActiveOn(c, iso));
  const profile = WEEKLY_CONSUMPTION_MW[dayIndex] ?? WEEKDAY_MW;

  const appearing = new Map<string, VolumeContract>();

  const hours = HOURS.map((hour): HourVolume => {
    const consumption = profile[hour] ?? 0;
    const covering = active.filter((c) => windowCoversHour(c, dayIndex, hour));
    const fixed = covering.filter((c) => pricingLayer(c) === "fixed");
    const floating = covering.filter((c) => pricingLayer(c) === "floating");

    const bands: Record<string, number> = {};
    let fixedTotal = 0;
    for (const c of fixed) {
      const mw = contractNominalMw(c, hour);
      bands[c.id] = Math.round(mw * 10) / 10;
      fixedTotal += mw;
      if (!appearing.has(c.id))
        appearing.set(c.id, { id: c.id, name: c.name, layer: "fixed" });
    }

    const remaining = Math.max(0, consumption - fixedTotal);
    // Floating (spot) fills the remaining load, split evenly across whichever
    // floating contracts apply this hour.
    if (floating.length > 0 && remaining > 0) {
      const share = remaining / floating.length;
      for (const c of floating) {
        bands[c.id] = Math.round(share * 10) / 10;
        if (!appearing.has(c.id))
          appearing.set(c.id, { id: c.id, name: c.name, layer: "floating" });
      }
    } else {
      for (const c of floating) {
        bands[c.id] = 0;
        if (!appearing.has(c.id))
          appearing.set(c.id, { id: c.id, name: c.name, layer: "floating" });
      }
    }

    const uncovered =
      floating.length === 0 ? Math.round(remaining * 10) / 10 : 0;
    const overHedge = Math.round(Math.max(0, fixedTotal - consumption) * 10) / 10;

    return { hour, hourLabel: pad(hour), consumption, bands, uncovered, overHedge };
  });

  // Order: fixed contracts first (bottom of the stack), then floating; stable
  // by id within each layer.
  const ordered = [...appearing.values()].sort((a, b) => {
    if (a.layer !== b.layer) return a.layer === "fixed" ? -1 : 1;
    return a.id.localeCompare(b.id);
  });

  return { hours, contracts: ordered };
}

// --- Story (take-action callouts) --------------------------------------------

export interface VolumeStory {
  uncoveredMwh: number;
  uncoveredHours: number[];
  overHedgeMwh: number;
  overHedgeHours: number[];
  consumptionMwh: number;
}

export function dayVolumeStory(breakdown: VolumeBreakdown): VolumeStory {
  let uncoveredMwh = 0;
  let overHedgeMwh = 0;
  let consumptionMwh = 0;
  const uncoveredHours: number[] = [];
  const overHedgeHours: number[] = [];

  for (const h of breakdown.hours) {
    consumptionMwh += h.consumption;
    if (h.uncovered > 0.05) {
      uncoveredMwh += h.uncovered;
      uncoveredHours.push(h.hour);
    }
    if (h.overHedge > 0.05) {
      overHedgeMwh += h.overHedge;
      overHedgeHours.push(h.hour);
    }
  }

  return {
    uncoveredMwh: Math.round(uncoveredMwh * 10) / 10,
    uncoveredHours,
    overHedgeMwh: Math.round(overHedgeMwh * 10) / 10,
    overHedgeHours,
    consumptionMwh: Math.round(consumptionMwh * 10) / 10,
  };
}

// Group consecutive hours into "HH:00–HH:00" range labels (end is exclusive,
// so a run ending at 23 reads as "…–24:00").
export function formatHourRanges(hours: number[]): string {
  if (hours.length === 0) return "";
  const sorted = [...hours].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    const h = sorted[i];
    if (h === prev + 1) {
      prev = h;
      continue;
    }
    ranges.push(`${pad(start)}–${pad(prev + 1)}`);
    start = h;
    prev = h;
  }
  return ranges.join(", ");
}
