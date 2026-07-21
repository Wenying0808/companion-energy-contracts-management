"use client";

import { useState } from "react";
import { Check, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Field, NativeSelect, DayPicker } from "@/components/wizard/fields";
import { SidePanel } from "@/components/ui/side-panel";
import { ContractParamsFields } from "@/components/contracts/contract-params-fields";
import { cn } from "@/lib/utils";
import { useAppStore, nextId } from "@/lib/store";
import {
  CONTRACT_TYPES,
  contractTypeLabel,
  paramsKindFor,
  defaultParams,
} from "@/lib/contract-types";
import { describeParameters } from "@/lib/format";
import { DAYS_OF_WEEK, type Contract, type DraftContract } from "@/lib/types";

type ReviewItem = DraftContract & { accepted: boolean };

export function ContractDraftReviewPanel({
  open,
  onOpenChange,
  drafts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drafts: DraftContract[];
}) {
  const assets = useAppStore((s) => s.assets);
  const addContracts = useAppStore((s) => s.addContracts);

  const [items, setItems] = useState<ReviewItem[]>(() =>
    drafts.map((d) => ({ ...d, accepted: true })),
  );
  const [selected, setSelected] = useState(0);

  const current = items[selected];
  const acceptedCount = items.filter((i) => i.accepted).length;

  function update(patch: Partial<ReviewItem>) {
    setItems((prev) =>
      prev.map((it, i) => (i === selected ? { ...it, ...patch } : it)),
    );
  }
  function updateTime(patch: Partial<ReviewItem["timeWindow"]>) {
    update({ timeWindow: { ...current.timeWindow, ...patch } });
  }

  function handleAdd() {
    const toAdd: Contract[] = items
      .filter((i) => i.accepted)
      .map((i) => ({
        id: nextId("contract"),
        name: i.name,
        subtitle: i.supplier,
        assetId: i.assetId,
        supplier: i.supplier,
        type: i.type,
        startDate: i.startDate,
        endDate: i.endDate,
        timeWindow: i.timeWindow,
        parameters: i.parameters,
      }));
    addContracts(toAdd);
    onOpenChange(false);
  }

  if (!current) {
    return (
      <SidePanel open={open} onOpenChange={onOpenChange}>
        <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
          No drafts to review.
        </div>
      </SidePanel>
    );
  }

  return (
    <SidePanel
      open={open}
      onOpenChange={onOpenChange}
      labelledBy="review-title"
      className="max-w-4xl"
    >
      <div className="flex h-full flex-col">
        <div className="border-b p-5 pr-12">
          <h2 id="review-title" className="flex items-center gap-2 text-base font-medium">
            <Sparkles className="size-4 text-primary" />
            Review Drafted Contracts
          </h2>
          <p className="text-xs text-muted-foreground">
            {items.length} contract{items.length > 1 ? "s" : ""} drafted from your
            PDFs. Review, edit, and choose which to add.
          </p>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* Left rail: draft list */}
          <div className="w-56 shrink-0 overflow-y-auto border-r p-2">
            {items.map((it, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelected(i)}
                className={cn(
                  "mb-1 flex w-full flex-col gap-1 rounded-md border p-2.5 text-left transition-colors",
                  i === selected
                    ? "border-primary bg-accent"
                    : "border-transparent hover:bg-accent/60",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Contract {i + 1}
                  </span>
                  {it.accepted ? (
                    <Check className="size-3.5 text-green-600" />
                  ) : (
                    <span className="text-[10px] text-muted-foreground">skip</span>
                  )}
                </span>
                <span className="truncate text-sm font-medium">
                  {it.name || contractTypeLabel(it.type)}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {contractTypeLabel(it.type)}
                </span>
              </button>
            ))}
          </div>

          {/* Right: editable detail */}
          <div className="min-w-0 flex-1 overflow-y-auto p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="size-3.5" />
                <span className="truncate">{current.sourceFileName}</span>
                <Badge variant="secondary" className="ml-1">
                  {Math.round(current.confidence * 100)}% confident
                </Badge>
              </div>
              <Button
                size="sm"
                variant={current.accepted ? "outline" : "default"}
                onClick={() => update({ accepted: !current.accepted })}
              >
                {current.accepted ? "Skip this one" : "Include"}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Contract Name" className="col-span-2">
                <Input
                  value={current.name}
                  onChange={(e) => update({ name: e.target.value })}
                />
              </Field>
              <Field label="Asset">
                <NativeSelect
                  value={current.assetId}
                  onChange={(e) => update({ assetId: e.target.value })}
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Supplier">
                <Input
                  value={current.supplier}
                  onChange={(e) => update({ supplier: e.target.value })}
                />
              </Field>
              <Field label="Contract Type" className="col-span-2">
                <NativeSelect
                  value={current.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    const kind = paramsKindFor(type);
                    // Keep params if the kind is unchanged, else reset to defaults.
                    update({
                      type,
                      parameters:
                        kind === current.parameters.kind
                          ? current.parameters
                          : defaultParams(kind),
                    });
                  }}
                >
                  {CONTRACT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Start Date">
                <Input
                  type="date"
                  value={current.startDate}
                  onChange={(e) => update({ startDate: e.target.value })}
                />
              </Field>
              <Field label="End Date">
                <Input
                  type="date"
                  value={current.endDate}
                  onChange={(e) => update({ endDate: e.target.value })}
                />
              </Field>
            </div>

            <div className="my-5 border-t" />

            <p className="mb-3 text-sm font-medium">
              Parameters
              <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">
                {describeParameters(current.parameters)}
              </span>
            </p>
            <ContractParamsFields
              params={current.parameters}
              onChange={(parameters) => update({ parameters })}
            />

            <div className="my-5 border-t" />

            <div className="grid grid-cols-2 gap-4">
              <Field label="Time Window">
                <NativeSelect
                  value={current.timeWindow.mode}
                  onChange={(e) =>
                    updateTime({ mode: e.target.value as "always" | "custom" })
                  }
                >
                  <option value="always">Always</option>
                  <option value="custom">Custom time window</option>
                </NativeSelect>
              </Field>
              {current.timeWindow.mode === "custom" && (
                <>
                  <div />
                  <Field label="Start Time (inclusive)">
                    <Input
                      value={current.timeWindow.startTime}
                      onChange={(e) => updateTime({ startTime: e.target.value })}
                    />
                  </Field>
                  <Field label="End Time (exclusive)">
                    <Input
                      value={current.timeWindow.endTime}
                      onChange={(e) => updateTime({ endTime: e.target.value })}
                    />
                  </Field>
                  <Field label="Days of the Week" className="col-span-2">
                    <DayPicker
                      days={DAYS_OF_WEEK}
                      value={current.timeWindow.daysOfWeek}
                      onChange={(next) =>
                        updateTime({
                          daysOfWeek:
                            next as ReviewItem["timeWindow"]["daysOfWeek"],
                        })
                      }
                    />
                  </Field>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t p-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={acceptedCount === 0}>
            Add {acceptedCount} contract{acceptedCount === 1 ? "" : "s"}
          </Button>
        </div>
      </div>
    </SidePanel>
  );
}
