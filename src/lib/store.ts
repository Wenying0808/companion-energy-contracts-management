"use client";

import { create } from "zustand";
import type { Asset, Contract, ContractTimeWindow, DayOfWeek } from "./types";
import { DAYS_OF_WEEK } from "./types";

// Simple incremental id generator (no DB, no persistence).
let idCounter = 100;
export function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

const GRID_CONNECTION: Asset = {
  id: "asset-grid",
  name: "Grid Connection",
  type: "Grid Connection",
  location: "Ottergemsesteenweg Zuid 808/b300, 9000 Gent, Belgium",
  dso: "Fluvius",
  dsoRegion: "Imewo",
  dsoConnectionType: "-",
  physicalPowerInjection: "-",
  physicalPowerConsumption: "-",
  nominate: false,
  integration: {
    apiIntegration: true,
    dataGranularity: "15 minutes",
    integrationFrequency: "batch",
  },
  position: { x: 120, y: 220 },
};

// --- Seed contracts ----------------------------------------------------------
// Illustrative portfolio on the Grid Connection asset, dated around 2026-07-27
// so the Graph view demonstrates every state: a deliberate overnight coverage
// GAP (no commodity contract 22:00–06:00), spot-only FLOATING hours, single
// FIXED hours, an over-hedged Mon–Fri midday OVERLAP, and a hedge expiring soon.

const WEEKDAYS: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];

function always(): ContractTimeWindow {
  return {
    mode: "always",
    startTime: "00:00:00",
    endTime: "24:00:00",
    daysOfWeek: [...DAYS_OF_WEEK],
    rangeInclusion: "Within",
  };
}

function customWindow(
  startTime: string,
  endTime: string,
  days: DayOfWeek[] = [...DAYS_OF_WEEK],
): ContractTimeWindow {
  return { mode: "custom", startTime, endTime, daysOfWeek: days, rangeInclusion: "Within" };
}

const SEED_CONTRACTS: Contract[] = [
  {
    id: "seed-spot",
    name: "Day-Ahead Spot",
    subtitle: "GreenVolt Energy",
    assetId: "asset-grid",
    supplier: "GreenVolt Energy",
    type: "dynamic",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    timeWindow: customWindow("06:00:00", "22:00:00"),
    parameters: {
      kind: "dayAheadSpot",
      category: "cost",
      spotProduct: "BE - Spot",
      constant: "12.50 €/MWh",
      scaling: "1",
      energyDirection: "Consumption",
      contractDirection: "Buy",
    },
  },
  {
    id: "seed-hedge-a",
    name: "Peak Fixed Hedge",
    subtitle: "GreenVolt Energy",
    assetId: "asset-grid",
    supplier: "GreenVolt Energy",
    type: "hedge",
    startDate: "2026-01-01",
    endDate: "2026-08-31", // expires ~5 weeks after today → timeline warning
    timeWindow: customWindow("08:00:00", "20:00:00", WEEKDAYS),
    parameters: {
      kind: "fixedHedge",
      hedgeBasis: "power",
      unit: "kW",
      price: "55.00 €/MWh",
      energyDirection: "Consumption",
    },
  },
  {
    id: "seed-hedge-b",
    name: "Core Fixed Hedge",
    subtitle: "GreenVolt Energy",
    assetId: "asset-grid",
    supplier: "GreenVolt Energy",
    type: "hedge",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    timeWindow: customWindow("09:00:00", "17:00:00", WEEKDAYS), // overlaps Peak Hedge midday
    parameters: {
      kind: "fixedHedge",
      hedgeBasis: "power",
      unit: "kW",
      price: "48.00 €/MWh",
      energyDirection: "Consumption",
    },
  },
  {
    id: "seed-ppa",
    name: "Solar PPA",
    subtitle: "SunField Renewables",
    assetId: "asset-grid",
    supplier: "SunField Renewables",
    type: "PPA",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    timeWindow: customWindow("08:00:00", "18:00:00"), // daylight production window
    parameters: {
      kind: "ppa",
      ppaType: "pay as produced",
      meterLocation: "onsite",
      price: "45.00 €/MWh",
      producingAsset: "Solar Panels",
      quantityScaling: "1",
    },
  },
  {
    id: "seed-tax",
    name: "Energy Tax",
    subtitle: "Federal levy",
    assetId: "asset-grid",
    supplier: "Belgian State",
    type: "energy tax",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    timeWindow: always(),
    parameters: { kind: "energyTax", price: "1.00 €/MWh", energyDirection: "Consumption" },
  },
  {
    id: "seed-fixed-cost",
    name: "Meter & Admin Fee",
    subtitle: "Fluvius",
    assetId: "asset-grid",
    supplier: "Fluvius",
    type: "fixed costs",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    timeWindow: always(),
    parameters: { kind: "fixedCost", costPerYear: "1,000.00 €/year" },
  },
  {
    id: "seed-access-power",
    name: "Grid Access Capacity",
    subtitle: "Fluvius",
    assetId: "asset-grid",
    supplier: "Fluvius",
    type: "access power",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    timeWindow: always(),
    parameters: { kind: "accessPower", accessCapacity: "250", regularCost: "3.50 €/kW" },
  },
];

interface AppState {
  assets: Asset[];
  contracts: Contract[];
  addAsset: (asset: Asset) => void;
  updateAsset: (id: string, patch: Partial<Asset>) => void;
  removeAsset: (id: string) => void;
  addContract: (contract: Contract) => void;
  addContracts: (contracts: Contract[]) => void;
  updateContract: (id: string, patch: Partial<Contract>) => void;
  removeContract: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Seeded with the prefilled Grid Connection asset and an illustrative
  // contract portfolio (see SEED_CONTRACTS).
  assets: [GRID_CONNECTION],
  contracts: SEED_CONTRACTS,
  addAsset: (asset) => set((s) => ({ assets: [...s.assets, asset] })),
  updateAsset: (id, patch) =>
    set((s) => ({
      assets: s.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    })),
  removeAsset: (id) =>
    set((s) => ({
      assets: s.assets.filter((a) => a.id !== id),
      contracts: s.contracts.filter((c) => c.assetId !== id),
    })),
  addContract: (contract) => set((s) => ({ contracts: [...s.contracts, contract] })),
  addContracts: (list) => set((s) => ({ contracts: [...s.contracts, ...list] })),
  updateContract: (id, patch) =>
    set((s) => ({
      contracts: s.contracts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),
  removeContract: (id) =>
    set((s) => ({ contracts: s.contracts.filter((c) => c.id !== id) })),
}));
