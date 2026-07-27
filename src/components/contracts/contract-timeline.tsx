"use client";

import { useMemo } from "react";
import { AlertTriangle, CalendarClock } from "lucide-react";
import type { Contract } from "@/lib/types";
import {
  daysBetween,
  expiryAnalysis,
  pricingLayer,
  type PricingLayer,
} from "@/lib/coverage";
import { contractTypeLabel } from "@/lib/contract-types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const LAYER_BAR: Record<PricingLayer, string> = {
  fixed: "bg-emerald-500",
  floating: "bg-sky-400",
  regulated: "bg-zinc-400 dark:bg-zinc-500",
};

const LAYER_LABEL: Record<PricingLayer, string> = {
  fixed: "Fixed",
  floating: "Floating",
  regulated: "Regulated",
};

const LAYER_ORDER: PricingLayer[] = ["fixed", "floating", "regulated"];

function monthStarts(minIso: string, maxIso: string): string[] {
  const [minY, minM] = minIso.split("-").map(Number);
  const out: string[] = [];
  let y = minY;
  let m = minM;
  // Walk month-by-month until we pass the axis end.
  for (let i = 0; i < 120; i++) {
    const iso = `${y}-${String(m).padStart(2, "0")}-01`;
    if (iso > maxIso) break;
    out.push(iso);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

export function ContractTimeline({
  contracts,
  date,
}: {
  contracts: Contract[];
  date: string;
}) {
  const rows = useMemo(
    () =>
      [...contracts]
        .filter((c) => c.startDate && c.endDate)
        .sort((a, b) => {
          const byLayer =
            LAYER_ORDER.indexOf(pricingLayer(a)) - LAYER_ORDER.indexOf(pricingLayer(b));
          return byLayer !== 0 ? byLayer : a.startDate.localeCompare(b.startDate);
        }),
    [contracts],
  );

  const { minIso, maxIso, total } = useMemo(() => {
    const starts = rows.map((c) => c.startDate).concat(date);
    const ends = rows.map((c) => c.endDate).concat(date);
    const min = starts.sort()[0];
    const max = ends.sort()[ends.length - 1];
    return { minIso: min, maxIso: max, total: Math.max(1, daysBetween(min, max)) };
  }, [rows, date]);

  const warnings = useMemo(
    () =>
      expiryAnalysis(contracts, date).filter(
        (e) => e.leavesGap || (e.layer === "fixed" && e.daysToExpiry <= 90),
      ),
    [contracts, date],
  );

  const pct = (iso: string) =>
    Math.min(100, Math.max(0, (daysBetween(minIso, iso) / total) * 100));

  const months = monthStarts(minIso, maxIso);
  const todayPct = pct(date);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No contracts with start/end dates to place on a timeline.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Temporal validity</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          When each contract is active. Watch for fixed coverage that lapses with nothing
          to replace it — that hour silently becomes spot-exposed.
        </p>
      </div>

      {/* Expiry warnings */}
      {warnings.length > 0 && (
        <div className="space-y-1.5">
          {warnings.map((w) => (
            <div
              key={w.contract.id}
              className={cn(
                "flex items-start gap-2 rounded-md border px-3 py-2 text-xs",
                w.leavesGap
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
              )}
            >
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              <span>
                <span className="font-medium">{w.contract.name}</span> expires in{" "}
                {w.daysToExpiry} days ({formatDate(w.contract.endDate)})
                {w.leavesGap
                  ? " — fixed coverage lapses with no replacement; those hours fall back to spot."
                  : "."}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Gantt */}
      <div className="flex gap-2">
        <div className="w-44 shrink-0 space-y-1 pt-6">
          {rows.map((c) => (
            <div key={c.id} className="flex h-6 items-center gap-1.5">
              <span className={cn("size-2 shrink-0 rounded-sm", LAYER_BAR[pricingLayer(c)])} />
              <span className="truncate text-xs font-medium" title={c.name}>
                {c.name}
              </span>
            </div>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          {/* Month axis */}
          <div className="relative h-6">
            {months.map((mIso) => (
              <span
                key={mIso}
                className="absolute top-0 -translate-x-1/2 text-[10px] text-muted-foreground"
                style={{ left: `${pct(mIso)}%` }}
              >
                {mIso.slice(5, 7)}/{mIso.slice(2, 4)}
              </span>
            ))}
          </div>

          {/* Vertical gridlines + today marker */}
          <div className="pointer-events-none absolute inset-0 top-6">
            {months.map((mIso) => (
              <span
                key={mIso}
                className="absolute top-0 bottom-0 w-px bg-border"
                style={{ left: `${pct(mIso)}%` }}
              />
            ))}
            <span
              className="absolute top-0 bottom-0 z-10 w-0.5 bg-primary"
              style={{ left: `${todayPct}%` }}
            >
              <span className="absolute -top-0 left-1 whitespace-nowrap text-[10px] font-medium text-primary">
                today
              </span>
            </span>
          </div>

          {/* Bars */}
          <div className="space-y-1">
            {rows.map((c) => {
              const left = pct(c.startDate);
              const width = Math.max(0.5, pct(c.endDate) - left);
              return (
                <div key={c.id} className="relative h-6">
                  <div
                    className={cn(
                      "absolute top-1 h-4 rounded-[3px] opacity-90",
                      LAYER_BAR[pricingLayer(c)],
                    )}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`${contractTypeLabel(c.type)} · ${formatDate(c.startDate)} → ${formatDate(c.endDate)}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {LAYER_ORDER.map((layer) => (
          <span key={layer} className="flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-sm", LAYER_BAR[layer])} />
            {LAYER_LABEL[layer]}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <CalendarClock className="size-3.5" /> as of {date}
        </span>
      </div>
    </div>
  );
}
