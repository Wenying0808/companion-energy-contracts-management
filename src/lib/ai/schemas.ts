import { z } from "zod";
import { CONTRACT_TYPES } from "@/lib/contract-types";
import type { ParamsKind } from "@/lib/types";

const TYPE_VALUES = CONTRACT_TYPES.map((t) => t.value) as [string, ...string[]];

// A document may bundle several contracts. Segmentation lists each distinct one.
export const SegmentationSchema = z.object({
  contracts: z
    .array(
      z.object({
        type: z.enum(TYPE_VALUES).describe("The best-matching contract type value."),
        title: z
          .string()
          .describe(
            "A short identifier for this specific contract within the document — its heading, contract name, or a distinguishing detail. Used to disambiguate when a document contains several contracts.",
          ),
        confidence: z.number().min(0).max(1).describe("Confidence between 0 and 1."),
      }),
    )
    .describe(
      "One entry per DISTINCT contract found in the document. A document with a single contract yields exactly one entry; a document bundling several contracts yields one entry each.",
    ),
});

const timeWindowSchema = z.object({
  mode: z.enum(["always", "custom"]).describe("Use 'always' unless the contract restricts to specific hours/days."),
  startTime: z.string().describe("HH:MM:SS, e.g. 09:00:00. Use 00:00:00 if not specified."),
  endTime: z.string().describe("HH:MM:SS, e.g. 17:00:00. Use 24:00:00 if not specified."),
  daysOfWeek: z
    .array(z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]))
    .describe("Applicable weekdays; all seven if not specified."),
  rangeInclusion: z.enum(["Within", "Outside"]),
});

const commonShape = {
  name: z.string().describe("A concise contract name."),
  supplier: z.string().describe("Counterparty / supplier name. Empty string if unknown."),
  startDate: z.string().describe("ISO date yyyy-mm-dd. Empty string if not found."),
  endDate: z.string().describe("ISO date yyyy-mm-dd. Empty string if not found."),
  timeWindow: timeWindowSchema,
};

const paramsByKind = {
  dayAheadSpot: z.object({
    kind: z.literal("dayAheadSpot"),
    category: z.enum(["cost", "revenue"]),
    spotProduct: z.string().describe('e.g. "BE - Spot".'),
    constant: z.string().describe('Optional constant offset e.g. "10.00 €/MWh"; empty if none.'),
    scaling: z.string().describe('Optional scaling factor e.g. "2"; empty if none.'),
    energyDirection: z.enum(["Consumption", "Injection"]),
    contractDirection: z.enum(["Buy", "Sell", "Not Applicable"]),
  }),
  averageDayAheadSpot: z.object({
    kind: z.literal("averageDayAheadSpot"),
    category: z.enum(["cost", "revenue"]),
    spotProduct: z.string().describe('e.g. "BE - Spot".'),
    constant: z.string().describe('Optional constant offset e.g. "10.00 €/MWh"; empty if none.'),
    scaling: z.string().describe('Optional scaling factor e.g. "2"; empty if none.'),
    energyDirection: z.enum(["Consumption", "Injection"]),
    contractDirection: z.enum(["Buy", "Sell", "Not Applicable"]),
    period: z
      .enum(["daily", "weekly", "monthly", "quarterly", "annually"])
      .describe("The averaging period for the spot price."),
  }),
  accessPower: z.object({
    kind: z.literal("accessPower"),
    accessCapacity: z.string().describe("Contracted access capacity in kW; empty if not specified."),
    regularCost: z.string().describe("Regular cost per kW, e.g. \"12.00 €/kW\"."),
  }),
  fixedHedge: z.object({
    kind: z.literal("fixedHedge"),
    hedgeBasis: z.enum(["power", "energy"]),
    unit: z.enum(["kW", "kWh"]),
    price: z.string().describe("Price in €/MWh."),
    energyDirection: z.enum(["Consumption", "Injection"]),
  }),
  fixedCost: z.object({
    kind: z.literal("fixedCost"),
    costPerYear: z.string().describe("Fixed cost in €/year."),
  }),
  energyTax: z.object({
    kind: z.literal("energyTax"),
    price: z.string().describe("Price in €/MWh."),
    energyDirection: z.enum(["Consumption", "Injection"]),
  }),
  ppa: z.object({
    kind: z.literal("ppa"),
    ppaType: z.enum(["pay as consumed", "pay as produced"]),
    meterLocation: z.enum(["onsite", "offsite"]),
    price: z.string().describe("Price in €/MWh."),
    producingAsset: z.string().describe("Producing asset, e.g. Solar Panels / Wind."),
    quantityScaling: z.string().describe('Quantity scaling factor, default "1".'),
  }),
  generic: z.object({
    kind: z.literal("generic"),
    fields: z
      .array(z.object({ label: z.string(), value: z.string() }))
      .describe("Any relevant parameters as label/value pairs."),
  }),
} as const;

// Builds the full extraction schema (common fields + typed params) for a kind.
export function extractionSchema(kind: ParamsKind) {
  return z.object({
    ...commonShape,
    parameters: paramsByKind[kind],
  });
}
