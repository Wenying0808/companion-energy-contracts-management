"use client";

import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Layers } from "lucide-react";
import type { Contract } from "@/lib/types";
import { DAYS_OF_WEEK } from "@/lib/types";
import {
  dayVolumeStory,
  energyContractsForDate,
  formatHourRanges,
  hourlyVolumeBreakdown,
  weekdayIndex,
} from "@/lib/volume";
import { cn } from "@/lib/utils";

// Per-contract colours — distinct hues echoing the repo's Tailwind palette.
// Assigned in fixed→floating order, so the first fixed contract reads emerald
// and the first floating (spot) reads sky — matching the heatmap's convention.
const CONTRACT_COLORS = [
  "#10b981", // emerald — fixed (matches heatmap "fixed")
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#38bdf8", // sky — spot/floating (matches heatmap "floating")
  "#ec4899", // pink
  "#14b8a6", // teal
  "#fb923c", // orange
  "#a3e635", // lime
];
const UNCOVERED_COLOR = "#f43f5e"; // rose — matches the heatmap's "gap"
const DAY_LABELS = DAYS_OF_WEEK.map((d) =>
  d.slice(0, 3).replace(/^\w/, (c) => c.toUpperCase()),
);

export function ContractVolumeChart({
  contracts,
  date,
}: {
  contracts: Contract[];
  date: string;
}) {
  const [dayIndex, setDayIndex] = useState(() => weekdayIndex(date));

  const breakdown = useMemo(
    () => hourlyVolumeBreakdown(contracts, date, dayIndex),
    [contracts, date, dayIndex],
  );
  const story = useMemo(() => dayVolumeStory(breakdown), [breakdown]);

  // Stable colour per contract — assigned from the full active set (not the
  // per-day list) so a contract keeps its colour as the day picker changes.
  const colorFor = useMemo(() => {
    const map: Record<string, string> = {};
    energyContractsForDate(contracts, date).forEach((c, i) => {
      map[c.id] = CONTRACT_COLORS[i % CONTRACT_COLORS.length];
    });
    return map;
  }, [contracts, date]);

  // Recharts rows: one per hour, with a key per contract band + uncovered.
  const data = useMemo(
    () =>
      breakdown.hours.map((h) => ({
        hour: h.hourLabel,
        consumption: h.consumption,
        uncovered: h.uncovered,
        ...h.bands,
      })),
    [breakdown.hours],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Volume coverage</h3>
          <p className="mt-0.5 max-w-xl text-xs text-muted-foreground">
            The same hours, now weighted by an illustrative consumption profile (MW).
            Each contract is a stacked band; the line is load. Bands rising above the
            line are over-hedged (locked volume you don&apos;t consume); load above the
            bands is uncovered — open exposure.
          </p>
        </div>
        {/* Day picker */}
        <div className="inline-flex shrink-0 rounded-lg border bg-muted/40 p-0.5">
          {DAY_LABELS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setDayIndex(i)}
              className={cn(
                "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                dayIndex === i
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="hour"
              interval={2}
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
              stroke="var(--color-border)"
            />
            <YAxis
              unit=" MW"
              width={64}
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
              stroke="var(--color-border)"
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-popover)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--color-popover-foreground)",
              }}
              formatter={(value) => `${value ?? 0} MW`}
              labelFormatter={(label) => `${label} — ${DAY_LABELS[dayIndex]}`}
            />
            {breakdown.contracts.map((c) => (
              <Area
                key={c.id}
                type="linear"
                dataKey={c.id}
                name={c.name}
                stackId="v"
                stroke={colorFor[c.id]}
                fill={colorFor[c.id]}
                fillOpacity={0.65}
              />
            ))}
            <Area
              type="linear"
              dataKey="uncovered"
              name="Uncovered"
              stackId="v"
              stroke={UNCOVERED_COLOR}
              fill={UNCOVERED_COLOR}
              fillOpacity={0.55}
            />
            <Line
              type="linear"
              dataKey="consumption"
              name="Consumption"
              stroke="var(--color-foreground)"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {breakdown.contracts.map((c) => (
          <span key={c.id} className="inline-flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-sm"
              style={{ backgroundColor: colorFor[c.id] }}
            />
            {c.name}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-sm"
            style={{ backgroundColor: UNCOVERED_COLOR }}
          />
          Uncovered
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-sm bg-foreground" />
          Consumption
        </span>
      </div>

      {/* Take-action story */}
      {(story.uncoveredMwh > 0 || story.overHedgeMwh > 0) && (
        <div className="grid gap-2 sm:grid-cols-2">
          {story.uncoveredMwh > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-xs">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-500" />
              <p>
                <span className="font-semibold">
                  ~{story.uncoveredMwh} MWh uncovered
                </span>{" "}
                on {DAY_LABELS[dayIndex]} ({formatHourRanges(story.uncoveredHours)}) — open
                market exposure with no contract applying. Extend the spot window or add a
                block to close the gap.
              </p>
            </div>
          )}
          {story.overHedgeMwh > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-400/40 bg-amber-400/5 p-3 text-xs">
              <Layers className="mt-0.5 size-4 shrink-0 text-amber-500" />
              <p>
                <span className="font-semibold">
                  ~{story.overHedgeMwh} MWh over-hedged
                </span>{" "}
                on {DAY_LABELS[dayIndex]} ({formatHourRanges(story.overHedgeHours)}) — fixed
                contracts lock more volume than you consume, so you pay a fixed price and
                resell the surplus at spot. Trim hedge volume in this window.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
