# Energy Contracts Management

A Next.js skeleton for managing energy **assets** and their **contracts**. No auth, no
database — all state lives in an in-memory store, seeded with a single prefilled
Grid Connection asset.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (base-nova / Base UI primitives)
- **@xyflow/react** (React Flow) — the Control Room canvas
- **Zustand** — in-memory store for assets & contracts

## Run

```bash
npm run dev     # http://localhost:3000  (redirects to /control-room)
npm run build   # production build + type check
npm run lint
```

## Structure

```
src/
  app/
    layout.tsx            # root layout → AppShell (sidebar + top bar)
    page.tsx              # redirects to /control-room
    control-room/page.tsx # React Flow canvas + asset detail panel
    contracts/page.tsx    # contracts table + empty state
  components/
    layout/               # sidebar, top-bar, nav config
    control-room/         # AssetNode, AssetDetailPanel
    assets/asset-wizard   # 4-step: Basic → Config → Integration → Summary
    contracts/contract-wizard # 4-step: Details → Parameters → Time Window → Review
    wizard/               # shared Stepper + form fields
    ui/                   # shadcn primitives + custom SidePanel slide-over
  lib/
    types.ts              # Asset / Contract domain model
    store.ts              # Zustand store (seeded Grid Connection, no contracts)
    format.ts             # table display helpers (time window, parameters, dates)
```

## What's here

- **Sidebar** with System / Insights / Flexibility sections. Only **Control Room**
  and **Contracts** are wired to routes; the rest are visual placeholders.
- **Control Room** — canvas with the prefilled **Grid Connection** node. **Add
  Asset** opens the asset wizard; clicking a node opens a detail panel with
  chart placeholders and an **Add Contract** button.
- **Contracts** — table (empty by default) with an **Add Contract** wizard; row
  actions to edit/delete.

### A note on `SidePanel`

Both wizards use a custom `components/ui/side-panel.tsx` slide-over instead of the
shadcn `Sheet`. The Base UI dialog in this registry waits for a transition-end to
unmount, which doesn't fire reliably under Tailwind v4 and leaves the dialog stuck
open. `SidePanel` mounts/unmounts purely on the `open` boolean, so open/close is
deterministic.

## Add Contract flows

Both the Contracts toolbar/empty-state and the asset detail panel use
`AddContractMenu`, a dropdown with two options (plus a tooltip explaining why
contracts matter for an asset):

- **Add manually** → the 4-step `ContractWizard`.
- **Extract from PDF (AI)** → `ContractUploadPanel`, a multi-file PDF uploader
  (drag & drop or browse) with an asset selector → the AI pipeline → the review panel.

## AI contract extraction

Built with the **Vercel AI SDK** (`ai`) + **`@ai-sdk/anthropic`**. Claude reads
the PDFs natively (no OCR/parse library).

**Setup (required to use extraction):**

1. Create an Anthropic API key at [console.anthropic.com](https://console.anthropic.com/).
2. Copy the env template and paste your key:

```bash
cp .env.example .env.local
# Edit .env.local:
# ANTHROPIC_API_KEY=sk-ant-...
```

3. Restart the dev server so Next.js picks up the env var:

```bash
npm run dev
```

Your Anthropic account needs available credits, or the API returns a
"credit balance too low" error (surfaced in the upload panel).

**Try it with sample PDFs** (`sample-contracts/`):

Synthetic one-page contracts cover every dedicated parameter form, plus a
multi-contract bundle:

| File | What it exercises |
| --- | --- |
| `01-day-ahead-spot.pdf` | Day-Ahead Spot |
| `02-fixed-hedge.pdf` | Fixed Hedge |
| `03-fixed-cost.pdf` | Fixed Cost |
| `04-energy-tax.pdf` | Energy Tax |
| `05-ppa.pdf` | PPA |
| `06-bundle-spot-and-tax.pdf` | Two contracts in one PDF (segmentation) |

1. Open **Contracts** (or an asset detail panel) → **Add Contract** →
   **Extract from PDF (AI)**.
2. Select an asset, then upload one or more files from `sample-contracts/`.
3. Review the drafts (edit fields if needed), accept, and **Add N contracts**.

See `sample-contracts/README.md` for expected parameters per file.

**Pipeline** (`src/lib/ai/*`, `src/app/api/extract-contracts/route.ts`):

1. `POST /api/extract-contracts` (multipart: `files[]` + `assetId`) — server-side only.
2. For each PDF: **segment** it into the individual contracts it contains and
   classify each (Haiku), then **extract** each one's type-specific fields (Sonnet)
   with the matching Zod schema. A single PDF may bundle several contracts, so one
   file can produce several drafts.
3. Returns `DraftContract[]` (typed params + confidence + source filename), flattened
   across all uploaded files.

The "knowledge base" is the in-code registry in `src/lib/contract-types.ts`
(21 contract types) serialized into the prompt — swap for retrieval later if it grows.

**Review** (`ContractDraftReviewPanel`): draft list on the left (Contract 1/2/3 +
confidence), an editable per-type form on the right (shares `ContractParamsFields`
with the wizard), accept/skip per draft, then **Add N contracts** (bulk
`addContracts`).

Model tiers are in `src/lib/ai/config.ts`.

## Contract types

`src/lib/contract-types.ts` is the single source of truth for all 21 types. Five are
modelled with dedicated parameter forms + extraction schemas — **Day-Ahead Spot,
Fixed Hedge, Fixed Cost, Energy Tax, PPA** — and every other type falls back to a
generic key/value parameter set. Add a dedicated form by giving a type a new
`paramsKind` and extending `ContractParameters`, `ContractParamsFields`, and
`src/lib/ai/schemas.ts`.

