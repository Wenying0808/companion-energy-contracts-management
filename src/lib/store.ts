"use client";

import { create } from "zustand";
import type { Asset, Contract } from "./types";

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
  // Seeded with the single prefilled Grid Connection asset. No seeded contracts.
  assets: [GRID_CONNECTION],
  contracts: [],
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
