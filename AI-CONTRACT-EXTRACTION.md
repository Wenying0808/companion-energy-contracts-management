# AI Contract Extraction

How PDF upload → structured contract drafts works in this app.

## Overview

Users upload one or more signed contract PDFs. The system:

1. **Segments & classifies** every distinct contract in each PDF
2. **Extracts** common + type-specific fields into a structured draft
3. Shows drafts in a **review panel** for edit / confirm before saving

Anti-hallucination rule (in the extract prompt): *use empty strings for values you cannot find; do not invent values.*

## End-to-end flow

```
Upload panel
  → POST /api/extract-contracts  (multipart: assetId + PDF files)
  → extractContracts() per PDF
      1. Segment/classify (Haiku + SegmentationSchema)
      2. Extract per segment (Sonnet + extractionSchema(kind))
  → JSON { drafts, failures }
  → Draft review panel → user edits → save as contracts
```

A single PDF may contain **multiple** contracts. Each becomes its own draft.

## Key files

| Role | Path |
|------|------|
| Extraction orchestration + prompts | `src/lib/ai/extract.ts` |
| Zod schemas for LLM structured output | `src/lib/ai/schemas.ts` |
| Model IDs | `src/lib/ai/config.ts` |
| Contract type registry, descriptions, defaults | `src/lib/contract-types.ts` |
| TypeScript param shapes | `src/lib/types.ts` |
| API route | `src/app/api/extract-contracts/route.ts` |
| Upload UI | `src/components/contracts/contract-upload-panel.tsx` |
| Draft review UI | `src/components/contracts/contract-draft-review-panel.tsx` |
| Per-type form fields (wizard + review) | `src/components/contracts/contract-params-fields.tsx` |

## Configuration

- **API key:** `ANTHROPIC_API_KEY` in `.env.local`
- **Classify model:** `MODEL_CLASSIFY` in `src/lib/ai/config.ts` (Haiku)
- **Extract model:** `MODEL_EXTRACT` in `src/lib/ai/config.ts` (Sonnet)
- **Route timeout:** `maxDuration = 300` on the API route

## Step 1 — Segment & classify

`generateObject` with `SegmentationSchema`:

For each distinct contract in the PDF, the model returns:

- `type` — must be one of `CONTRACT_TYPES[].value`
- `title` — short identifier within the document
- `confidence` — 0–1

The type list + descriptions come from `knowledgeBaseText()` in `contract-types.ts`.

## Step 2 — Extract fields

For each segment:

1. Resolve `paramsKind` via `paramsKindFor(seg.type)`
2. Call `generateObject` with `extractionSchema(kind)`
3. Prompt includes contract label, description, focus text (if multi-contract), and:
   *“Use empty strings for values you cannot find; do not invent values.”*

### Common fields (every type)

| Field | Notes |
|-------|--------|
| `name` | Concise contract name |
| `supplier` | Empty string if unknown |
| `startDate` / `endDate` | ISO `yyyy-mm-dd`; empty if not found |
| `timeWindow` | `always` vs `custom` hours/days |

### Type-specific `parameters`

Driven by `paramsKind` on each entry in `CONTRACT_TYPES`. Defined in:

- TypeScript: `src/lib/types.ts` (`DayAheadSpotParams`, `PpaParams`, …)
- Zod: `paramsByKind` in `src/lib/ai/schemas.ts`
- UI: `ContractParamsFields` switch cases
- Defaults: `defaultParams()` in `contract-types.ts`

| `paramsKind` | Example contract types | Notable fields |
|--------------|------------------------|----------------|
| `dayAheadSpot` | Day-Ahead Spot (`dynamic`) | category, spotProduct, constant, scaling, directions |
| `averageDayAheadSpot` | Average Day-Ahead Spot (`variable`) | same + averaging `period` |
| `accessPower` | Access Power | accessCapacity, regularCost |
| `fixedHedge` | Fixed Hedge | hedgeBasis, unit, price, energyDirection |
| `fixedCost` | Fixed Cost | costPerYear |
| `energyTax` | Energy Tax | price, energyDirection |
| `ppa` | Physical PPA, Virtual PPA | ppaType, meterLocation, price, producingAsset, quantityScaling |
| `generic` | Many others | free-form `{ label, value }[]` |

## How fields are defined for the LLM

Two layers:

1. **Classification knowledge base** — `description` on each `ContractTypeDef` (via `knowledgeBaseText()`)
2. **Extraction schema** — Zod object + `.describe(...)` on each field in `schemas.ts`

`generateObject` enforces the schema shape. Optional string fields should be documented as empty when missing, e.g.:

```ts
accessCapacity: z.string().describe("Contracted access capacity in kW; empty if not specified.")
```

### Caveat: enums

String fields can be `""`. **Enums** (`energyDirection`, `ppaType`, etc.) still require a valid enum value — the model cannot leave them blank unless the schema is changed (optional enum / `"unknown"` sentinel).

## Adding or changing a typed parameter set

Keep these four in sync:

1. **`src/lib/types.ts`** — params interface + `ContractParameters` union
2. **`src/lib/ai/schemas.ts`** — matching entry in `paramsByKind` with clear `.describe()` text (especially “empty if not found”)
3. **`src/lib/contract-types.ts`** — set `paramsKind` / `description`; update `defaultParams()`
4. **`src/components/contracts/contract-params-fields.tsx`** — form inputs for review/wizard

For types that don’t need a custom shape yet, use `paramsKind: "generic"`.

## Draft output shape

See `DraftContract` in `src/lib/types.ts`:

- Common contract fields + `parameters`
- `confidence` from segmentation
- `sourceFileName` of the uploaded PDF
- `assetId` from the upload form

## Related UX entry points

- Contracts page / control room → “Extract from PDF (AI)” → `contract-upload-panel`
- After extract → `contract-draft-review-panel` for review and selective add
