"use client";

import { useMemo } from "react";
import { Info } from "lucide-react";
import type { Contract } from "@/lib/types";
import { DAYS_OF_WEEK } from "@/lib/types";
import {
  coverageGrid,
  coverageSummary,
  typeLabelsForLayer,
  type CoverageStatus,
} from "@/lib/coverage";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ContractVolumeChart } from "./contract-volume-chart";
import { cn } from "@/lib/utils";

const STATUS_META: Record<
  CoverageStatus,
  { label: string; cell: string; swatch: string; blurb: string }
> = {
  gap: {
    label: "Unpriced (gap)",
    cell: "bg-rose-500/80",
    swatch: "bg-rose-500",
    blurb: "No commodity contract prices this hour — silent open exposure.",
  },
  floating: {
    label: "Floating (spot)",
    cell: "bg-sky-400/70",
    swatch: "bg-sky-400",
    blurb: "Priced only at the spot market price.",
  },
  fixed: {
    label: "Fixed",
    cell: "bg-emerald-500/80",
    swatch: "bg-emerald-500",
    blurb: "A fixed-price hedge/PPA covers this hour (settles against spot).",
  },
  overlap: {
    label: "Overlaps",
    cell: "bg-amber-400/90",
    swatch: "bg-amber-400",
    blurb: "Two or more fixed contracts cover the same hour — the price is locked more than once (shown even if spot also covers the hour).",
  },
};

const DAY_LABELS = DAYS_OF_WEEK.map((d) => d.slice(0, 3).replace(/^\w/, (c) => c.toUpperCase()));
const HOURS = Array.from({ length: 24 }, (_, h) => h);

export function ContractCoverage({
  contracts,
  date,
}: {
  contracts: Contract[];
  date: string;
}) {
  const grid = useMemo(() => coverageGrid(contracts, date), [contracts, date]);
  const summary = useMemo(() => coverageSummary(grid), [grid]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Hourly price coverage</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Each cell is one hour of a typical week (as of {date}), coloured by its most
          significant state — overlap, then fixed, then floating, then gap. So an hour with
          two hedges and spot reads as an overlap; hover any cell to see every contract
          covering it. Coverage here is presence-based; the volume view below weights the
          same hours by an illustrative consumption profile.
        </p>
      </div>

      {/* Summary strip */}
      <div className="flex flex-wrap gap-3 text-sm">
        {(Object.keys(STATUS_META) as CoverageStatus[]).map((status) => (
          <div
            key={status}
            className="flex items-center gap-2 rounded-md border bg-card px-3 py-1.5"
          >
            <span className={cn("size-2.5 rounded-sm", STATUS_META[status].swatch)} />
            <span className="font-medium tabular-nums">{summary[status]}</span>
            <span className="text-muted-foreground">
              {STATUS_META[status].label} hrs/wk
            </span>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Hour axis */}
          <div className="mb-1 flex pl-10">
            {HOURS.map((h) => (
              <div
                key={h}
                className="flex-1 text-center text-[10px] text-muted-foreground tabular-nums"
              >
                {h % 3 === 0 ? h : ""}
              </div>
            ))}
          </div>
          {grid.map((row, dayIndex) => (
            <div key={dayIndex} className="mb-px flex items-center">
              <div className="w-10 shrink-0 pr-2 text-right text-xs text-muted-foreground">
                {DAY_LABELS[dayIndex]}
              </div>
              <div className="flex flex-1 gap-px">
                {row.map((cell, hour) => {
                  const covering = [...cell.fixed, ...cell.floating];
                  const title =
                    cell.status === "gap"
                      ? `${DAY_LABELS[dayIndex]} ${hour}:00 — unpriced (gap)`
                      : `${DAY_LABELS[dayIndex]} ${hour}:00 — ${STATUS_META[cell.status].label}: ${covering.join(", ")}`;
                  return (
                    <div
                      key={hour}
                      title={title}
                      className={cn(
                        "h-6 flex-1 rounded-[2px] transition-transform hover:scale-125 hover:ring-1 hover:ring-foreground/30",
                        STATUS_META[cell.status].cell,
                      )}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="grid gap-2 sm:grid-cols-2">
        {(Object.keys(STATUS_META) as CoverageStatus[]).map((status) => (
          <div key={status} className="flex items-start gap-2 text-xs">
            <span
              className={cn("mt-0.5 size-3 shrink-0 rounded-sm", STATUS_META[status].swatch)}
            />
            <div>
              <span className="inline-flex items-center gap-1 font-medium">
                {STATUS_META[status].label}
                {(status === "fixed" || status === "floating") && (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <button
                          type="button"
                          aria-label={`${STATUS_META[status].label} contract types`}
                          className="text-muted-foreground hover:text-foreground"
                        />
                      }
                    >
                      <Info className="size-3" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <p className="font-medium">Included contract types</p>
                        <ul className="list-disc space-y-0.5 pl-3.5">
                          {typeLabelsForLayer(status).map((label) => (
                            <li key={label}>{label}</li>
                          ))}
                        </ul>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}
              </span>
              <span className="text-muted-foreground"> — {STATUS_META[status].blurb}</span>
            </div>
          </div>
        ))}
      </div>

      <Separator />

      {/* Volume-weighted view */}
      <ContractVolumeChart contracts={contracts} date={date} />
    </div>
  );
}
