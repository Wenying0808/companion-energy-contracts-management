// Domain types for the Energy Contracts Management skeleton.
// No DB — these shapes back the in-memory Zustand store and are designed so the
// future roadmap (PDF upload -> AI extraction -> review -> relationship graph)
// can populate them without structural changes.

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

export type ContractCategory = "Commodity" | "Grid & Regulated";

export type ContractType = "PPA" | "Taxes & Levies" | "Hedges" | "Spot";

export type EnergyDirection = "Consumption" | "Injection";

export type ContractDirection = "Buy" | "Sell";

export type RangeInclusion = "Within" | "Outside";

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

export interface ContractFinancials {
  contractType: string; // free-form label, e.g. "Day-Ahead Spot Contract"
  spotProduct: string; // e.g. "BE - Spot", "-" when N/A
  constant: string; // e.g. "10.00 €/MWh"
  scaling: string; // e.g. "2"
  energyDirection: EnergyDirection;
  contractDirection: ContractDirection;
}

export interface ContractTimeWindow {
  startTime: string; // "09:00:00"
  endTime: string; // "17:00:01"
  daysOfWeek: DayOfWeek[];
  rangeInclusion: RangeInclusion;
}

export interface Contract {
  id: string;
  name: string;
  subtitle: string; // small text under the name (e.g. supplier code "X", "engie")
  assetId: string;
  supplier: string;
  group: string; // e.g. "Consumption"
  category: ContractCategory;
  type: ContractType;
  subType: string; // e.g. "Physical Power Purchase", "Energy Tax", "Fixed Hedge"
  startDate: string; // ISO yyyy-mm-dd
  endDate: string; // ISO yyyy-mm-dd
  financial: ContractFinancials;
  timeWindow: ContractTimeWindow;
  volume: string; // e.g. "1 MW", "-"
  parametersDisplay: string; // pre-formatted badge text, e.g. "2 * BE Spot + 10.00 €/MWh"
}

export const CONTRACT_TYPE_META: Record<
  ContractType,
  { defaultCategory: ContractCategory; subTypes: string[] }
> = {
  PPA: {
    defaultCategory: "Commodity",
    subTypes: ["Physical Power Purchase"],
  },
  "Taxes & Levies": {
    defaultCategory: "Grid & Regulated",
    subTypes: ["Energy Tax", "Fixed Cost", "Grid Fee"],
  },
  Hedges: {
    defaultCategory: "Commodity",
    subTypes: ["Fixed Hedge", "Floating Hedge"],
  },
  Spot: {
    defaultCategory: "Commodity",
    subTypes: ["Day-Ahead Spot Contract", "Intraday Spot Contract"],
  },
};
