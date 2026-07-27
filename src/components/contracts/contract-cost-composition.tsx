"use client";

import { useMemo } from "react";
import type { Contract } from "@/lib/types";
import {
  costBucket,
  isNegotiable,
  isActiveOn,
  COST_BUCKET_LABEL,
  type CostBucket,
} from "@/lib/coverage";
import { contractTypeLabel } from "@/lib/contract-types";
import { describeParameters } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const BUCKET_ORDER: CostBucket[] = ["commodity", "grid", "taxes"];

const BUCKET_META: Record<
  CostBucket,
  { bar: string; swatch: string; note: string }
> = {
  commodity: {
    bar: "bg-violet-500",
    swatch: "bg-violet-500",
    note: "Energy price — negotiable with your supplier.",
  },
  grid: {
    bar: "bg-zinc-400 dark:bg-zinc-500",
    swatch: "bg-zinc-400 dark:bg-zinc-500",
    note: "Grid & network fees — set by the DSO, not negotiable.",
  },
  taxes: {
    bar: "bg-orange-400",
    swatch: "bg-orange-400",
    note: "Taxes & levies — set by the regulator, not negotiable.",
  },
};

export function ContractCostComposition({
  contracts,
  date,
}: {
  contracts: Contract[];
  date: string;
}) {
  const active = useMemo(
    () => contracts.filter((c) => isActiveOn(c, date)),
    [contracts, date],
  );

  const grouped = useMemo(() => {
    const g: Record<CostBucket, Contract[]> = { commodity: [], grid: [], taxes: [] };
    for (const c of active) g[costBucket(c.type)].push(c);
    return g;
  }, [active]);

  const total = active.length;

  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No active contracts on {date} to break down.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Cost composition</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Where your bill comes from and which parts are negotiable. Volumes aren&apos;t
          modelled yet, so this shows the structure and unit prices — not a summed euro total.
        </p>
      </div>

      {/* Share-by-count bar */}
      <div>
        <div className="flex h-8 w-full overflow-hidden rounded-md">
          {BUCKET_ORDER.map((bucket) => {
            const n = grouped[bucket].length;
            if (n === 0) return null;
            return (
              <div
                key={bucket}
                className={cn(
                  "flex items-center justify-center text-xs font-medium text-white",
                  BUCKET_META[bucket].bar,
                )}
                style={{ width: `${(n / total) * 100}%` }}
                title={`${COST_BUCKET_LABEL[bucket]}: ${n} of ${total}`}
              >
                {n}
              </div>
            );
          })}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Share by contract count (as of {date}).
        </p>
      </div>

      {/* Buckets */}
      <div className="grid gap-3 md:grid-cols-3">
        {BUCKET_ORDER.map((bucket) => {
          const list = grouped[bucket];
          return (
            <div key={bucket} className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-2">
                <span className={cn("size-3 rounded-sm", BUCKET_META[bucket].swatch)} />
                <span className="text-sm font-semibold">{COST_BUCKET_LABEL[bucket]}</span>
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                  {list.length}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {BUCKET_META[bucket].note}
              </p>
              <ul className="mt-3 space-y-2">
                {list.length === 0 ? (
                  <li className="text-xs text-muted-foreground">None</li>
                ) : (
                  list.map((c) => (
                    <li key={c.id} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-medium" title={c.name}>
                          {c.name}
                        </span>
                        <Badge
                          variant={isNegotiable(c.type) ? "secondary" : "outline"}
                          className="shrink-0"
                        >
                          {isNegotiable(c.type) ? "Negotiable" : "Fixed"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                        <span className="truncate">{contractTypeLabel(c.type)}</span>
                        <span className="shrink-0 font-mono">
                          {describeParameters(c.parameters)}
                        </span>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
