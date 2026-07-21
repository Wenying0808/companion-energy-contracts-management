// Domain types for the Energy Contracts Management app.
// No DB — these shapes back the in-memory Zustand store.

export type AssetType = "Grid Connection" | "Solar Panels" | "Battery" | "Wind";

export interface AssetIntegration {
  apiIntegration: boolean;
  dataGranularity: string; // e.g. "15 minutes"
  integrationFrequency: string; // e.g. "batch"
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  location: string;
  dso: string;
  dsoRegion: string;
  dsoConnectionType: string;
  physicalPowerInjection: string; // kW, "-" when unset
  physicalPowerConsumption: string; // kW, "-" when unset
  nominate: boolean;
  integration: AssetIntegration;
  position: { x: number; y: number };
}

// --- Contracts ---------------------------------------------------------------

// Table-level grouping used in the Contracts list.
export type ContractCategory = "Commodity" | "Grid & Regulated";

export type EnergyDirection = "Consumption" | "Injection";

export type SpotContractDirection = "Buy" | "Sell" | "Not Applicable";

export const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export type RangeInclusion = "Within" | "Outside";

export interface ContractTimeWindow {
  mode: "always" | "custom";
  startTime: string; // "09:00:00"
  endTime: string; // "17:00:01"
  daysOfWeek: DayOfWeek[];
  rangeInclusion: RangeInclusion;
}

// Per-type parameters, discriminated by `kind`. Five types are modelled in
// detail; every other contract type falls back to `generic` key/value fields.
export interface DayAheadSpotParams {
  kind: "dayAheadSpot";
  category: "cost" | "revenue";
  spotProduct: string; // e.g. "BE - Spot"
  constant: string; // optional, e.g. "10.00 €/MWh" ("" when unset)
  scaling: string; // optional, e.g. "2" ("" when unset)
  energyDirection: EnergyDirection;
  contractDirection: SpotContractDirection;
}

export type AveragingPeriod =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "annually";

// Same as Day-Ahead Spot, but settled at the average spot price over a period.
export interface AverageDayAheadSpotParams {
  kind: "averageDayAheadSpot";
  category: "cost" | "revenue";
  spotProduct: string;
  constant: string;
  scaling: string;
  energyDirection: EnergyDirection;
  contractDirection: SpotContractDirection;
  period: AveragingPeriod;
}

export interface AccessPowerParams {
  kind: "accessPower";
  accessCapacity: string; // kW, optional ("" when unset)
  regularCost: string; // €/kW
}

export interface FixedHedgeParams {
  kind: "fixedHedge";
  hedgeBasis: "power" | "energy";
  unit: "kW" | "kWh";
  price: string; // €/MWh
  energyDirection: EnergyDirection;
}

export interface FixedCostParams {
  kind: "fixedCost";
  costPerYear: string; // €/year
}

export interface EnergyTaxParams {
  kind: "energyTax";
  price: string; // €/MWh
  energyDirection: EnergyDirection;
}

export interface PpaParams {
  kind: "ppa";
  ppaType: "pay as consumed" | "pay as produced";
  meterLocation: "onsite" | "offsite";
  price: string; // €/MWh
  producingAsset: string; // e.g. "Solar Panels"
  quantityScaling: string; // default "1"
}

export interface GenericParams {
  kind: "generic";
  fields: { label: string; value: string }[];
}

export type ContractParameters =
  | DayAheadSpotParams
  | AverageDayAheadSpotParams
  | AccessPowerParams
  | FixedHedgeParams
  | FixedCostParams
  | EnergyTaxParams
  | PpaParams
  | GenericParams;

export type ParamsKind = ContractParameters["kind"];

export interface Contract {
  id: string;
  name: string;
  subtitle: string; // small text under the name (e.g. supplier)
  assetId: string;
  supplier: string;
  type: string; // contract-type registry `value` (see contract-types.ts)
  startDate: string; // ISO yyyy-mm-dd
  endDate: string; // ISO yyyy-mm-dd
  timeWindow: ContractTimeWindow;
  parameters: ContractParameters;
}

// A contract drafted by the extraction agent, awaiting user review.
export interface DraftContract {
  name: string;
  supplier: string;
  type: string;
  startDate: string;
  endDate: string;
  assetId: string;
  timeWindow: ContractTimeWindow;
  parameters: ContractParameters;
  confidence: number; // 0..1
  sourceFileName: string;
}
