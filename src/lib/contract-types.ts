// Single source of truth for the supported contract types. Drives the wizard,
// the review form, the contracts table, and the AI extraction prompts/schemas.

import type {
  ContractCategory,
  ContractParameters,
  ContractTimeWindow,
  ParamsKind,
} from "./types";

export interface ContractTypeDef {
  value: string; // matches the <option value> in the source UI
  label: string;
  defaultCategory: ContractCategory;
  paramsKind: ParamsKind;
  // Short knowledge-base description used in the extraction prompts.
  description: string;
}

// The 21 contract types).
export const CONTRACT_TYPES: ContractTypeDef[] = [
  { value: "access power", label: "Access Power", defaultCategory: "Grid & Regulated", paramsKind: "accessPower", description: "Charge for contracted grid access capacity: an optional access capacity in kW and a regular cost per kW." },
  { value: "variable", label: "Average Day-Ahead Spot Contract", defaultCategory: "Commodity", paramsKind: "averageDayAheadSpot", description: "Energy settled at the average day-ahead spot price over a period (daily, weekly, monthly, quarterly or annually), optionally scaled and offset by a constant." },
  { value: "dynamic", label: "Day-Ahead Spot Contract", defaultCategory: "Commodity", paramsKind: "dayAheadSpot", description: "Energy injected or consumed is settled at the hourly day-ahead spot market price, optionally scaled and offset by a constant." },
  { value: "futures hedge", label: "DCA Hedge", defaultCategory: "Commodity", paramsKind: "generic", description: "Dollar-cost-averaging futures hedge over a period." },
  { value: "energy tax", label: "Energy Tax", defaultCategory: "Grid & Regulated", paramsKind: "energyTax", description: "Per-MWh tax/levy applied to consumed or injected energy." },
  { value: "fixed costs", label: "Fixed Cost", defaultCategory: "Grid & Regulated", paramsKind: "fixedCost", description: "A fixed recurring cost expressed per year." },
  { value: "fixed revenue", label: "Fixed Energy Revenue", defaultCategory: "Commodity", paramsKind: "generic", description: "Fixed recurring energy revenue." },
  { value: "hedge", label: "Fixed Hedge", defaultCategory: "Commodity", paramsKind: "fixedHedge", description: "A fixed-price power or energy hedge at a set €/MWh price for a given direction." },
  { value: "grid losses compensation", label: "Grid Loss Compensation", defaultCategory: "Grid & Regulated", paramsKind: "generic", description: "Compensation for grid losses." },
  { value: "guarantee of origin", label: "Guarantee of Origin", defaultCategory: "Commodity", paramsKind: "generic", description: "Certificates guaranteeing renewable origin of energy." },
  { value: "imbalance", label: "Imbalance", defaultCategory: "Commodity", paramsKind: "generic", description: "Settlement of energy imbalance versus nomination." },
  { value: "imbalance cost market baseline", label: "Imbalance Cost Market Baseline", defaultCategory: "Commodity", paramsKind: "generic", description: "Imbalance cost measured against a market baseline." },
  { value: "energy revenue", label: "Indexed Energy Revenue", defaultCategory: "Commodity", paramsKind: "generic", description: "Energy revenue indexed to a market reference." },
  { value: "market data revenue", label: "Market Data Revenue", defaultCategory: "Commodity", paramsKind: "generic", description: "Revenue from providing market data or flexibility." },
  { value: "peak demand charges", label: "Peak Demand Charge", defaultCategory: "Grid & Regulated", paramsKind: "generic", description: "Charge based on peak power demand." },
  { value: "PPA", label: "Physical Power Purchase Agreement (PPA)", defaultCategory: "Commodity", paramsKind: "ppa", description: "Physical purchase of power from a producing asset at a fixed €/MWh, pay-as-consumed or pay-as-produced, onsite or offsite." },
  { value: "percentual hedge", label: "Profile Hedge", defaultCategory: "Commodity", paramsKind: "generic", description: "Hedge covering a percentage of the consumption/production profile." },
  { value: "spot", label: "Spot Contract", defaultCategory: "Commodity", paramsKind: "generic", description: "Generic spot-market settled contract." },
  { value: "supplier markup", label: "Supplier Markup", defaultCategory: "Commodity", paramsKind: "generic", description: "Supplier markup added on top of energy price." },
  { value: "tiered energy tax", label: "Tiered Energy Tax", defaultCategory: "Grid & Regulated", paramsKind: "generic", description: "Energy tax with volume-based tiers." },
  { value: "virtual PPA", label: "Virtual Power Purchase Agreement (PPA)", defaultCategory: "Commodity", paramsKind: "ppa", description: "Financial (virtual) PPA settled as a contract for difference at a fixed €/MWh, pay-as-consumed or pay-as-produced, onsite or offsite." },
];

const BY_VALUE = new Map(CONTRACT_TYPES.map((t) => [t.value, t]));

export function contractTypeDef(value: string): ContractTypeDef | undefined {
  return BY_VALUE.get(value);
}

export function contractTypeLabel(value: string): string {
  return BY_VALUE.get(value)?.label ?? value;
}

export function contractCategory(value: string): ContractCategory {
  return BY_VALUE.get(value)?.defaultCategory ?? "Commodity";
}

export function paramsKindFor(value: string): ParamsKind {
  return BY_VALUE.get(value)?.paramsKind ?? "generic";
}

// Default parameters for a given params kind (used for new contracts and when
// the contract type changes in the wizard).
export function defaultParams(kind: ParamsKind): ContractParameters {
  switch (kind) {
    case "dayAheadSpot":
      return {
        kind,
        category: "cost",
        spotProduct: "BE - Spot",
        constant: "",
        scaling: "",
        energyDirection: "Consumption",
        contractDirection: "Buy",
      };
    case "averageDayAheadSpot":
      return {
        kind,
        category: "cost",
        spotProduct: "BE - Spot",
        constant: "",
        scaling: "",
        energyDirection: "Consumption",
        contractDirection: "Buy",
        period: "monthly",
      };
    case "accessPower":
      return { kind, accessCapacity: "", regularCost: "" };
    case "fixedHedge":
      return {
        kind,
        hedgeBasis: "power",
        unit: "kW",
        price: "",
        energyDirection: "Consumption",
      };
    case "fixedCost":
      return { kind, costPerYear: "" };
    case "energyTax":
      return { kind, price: "", energyDirection: "Consumption" };
    case "ppa":
      return {
        kind,
        ppaType: "pay as consumed",
        meterLocation: "onsite",
        price: "",
        producingAsset: "",
        quantityScaling: "1",
      };
    case "generic":
    default:
      return { kind: "generic", fields: [] };
  }
}

export function defaultTimeWindow(): ContractTimeWindow {
  return {
    mode: "always",
    startTime: "00:00:00",
    endTime: "24:00:00",
    daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    rangeInclusion: "Within",
  };
}

// Knowledge-base text handed to the classifier / extractor.
export function knowledgeBaseText(): string {
  return CONTRACT_TYPES.map(
    (t) => `- "${t.value}" (${t.label}): ${t.description}`,
  ).join("\n");
}
