"use client";

import { useState } from "react";
import { Grid3x3, CalendarClock, Coins, Network } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Asset, Contract } from "@/lib/types";
import { ContractCoverage } from "./contract-coverage";
import { ContractTimeline } from "./contract-timeline";
import { ContractCostComposition } from "./contract-cost-composition";
import { cn } from "@/lib/utils";

type Lens = "coverage" | "timeline" | "cost";

const LENSES: { key: Lens; label: string; icon: React.ElementType }[] = [
  { key: "coverage", label: "Coverage", icon: Grid3x3 },
  { key: "timeline", label: "Timeline", icon: CalendarClock },
  { key: "cost", label: "Composition", icon: Coins },
];

// Today per the app's fixed clock (see currentDate).
const DEFAULT_DATE = "2026-07-27";

export function ContractGraph({
  contracts,
}: {
  contracts: Contract[];
  assets: Asset[];
}) {
  const [lens, setLens] = useState<Lens>("coverage");
  const [date, setDate] = useState(DEFAULT_DATE);

  if (contracts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
        <Network className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">No contracts to visualize</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Add contracts (or clear filters) to see coverage, timeline, and cost
          composition here.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4">
      {/* Lens toggle + shared date */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border bg-muted/40 p-0.5">
          {LENSES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setLens(key)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                lens === key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          As of
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-40"
          />
        </label>
      </div>

      {/* Lens content */}
      <div className="rounded-xl border bg-card p-4">
        {lens === "coverage" && <ContractCoverage contracts={contracts} date={date} />}
        {lens === "timeline" && <ContractTimeline contracts={contracts} date={date} />}
        {lens === "cost" && <ContractCostComposition contracts={contracts} date={date} />}
      </div>
    </div>
  );
}
