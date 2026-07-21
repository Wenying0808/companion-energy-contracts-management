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

## Roadmap (not yet built)

The data model and canvas are structured so these drop in later:

1. Upload signed contract PDFs.
2. Extract fields via an AI agent → draft a `Contract`.
3. User reviews the draft (reuses the contract wizard's Review step).
4. Visualize relationships between contracts on the canvas.
