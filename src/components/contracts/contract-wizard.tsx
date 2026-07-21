"use client";

import { useState } from "react";
import { SidePanel } from "@/components/ui/side-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Stepper } from "@/components/wizard/stepper";
import { Field, NativeSelect, DayPicker } from "@/components/wizard/fields";
import {
  ContractParamsFields,
  paramSummaryRows,
} from "@/components/contracts/contract-params-fields";
import { useAppStore, nextId } from "@/lib/store";
import { formatDate } from "@/lib/format";
import {
  CONTRACT_TYPES,
  contractTypeLabel,
  contractCategory,
  paramsKindFor,
  defaultParams,
  defaultTimeWindow,
} from "@/lib/contract-types";
import { DAYS_OF_WEEK, type Contract } from "@/lib/types";

const STEPS = [
  { key: "details", label: "Contract Details" },
  { key: "parameters", label: "Parameters" },
  { key: "timewindow", label: "Time Window" },
  { key: "review", label: "Review & Submit" },
];

type Draft = Omit<Contract, "id">;

function emptyDraft(assetId: string): Draft {
  return {
    name: "",
    subtitle: "",
    assetId,
    supplier: "",
    type: "dynamic",
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    timeWindow: defaultTimeWindow(),
    parameters: defaultParams("dayAheadSpot"),
  };
}

export function ContractWizard({
  open,
  onOpenChange,
  defaultAssetId,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultAssetId?: string;
  editing?: Contract | null;
}) {
  const assets = useAppStore((s) => s.assets);
  const addContract = useAppStore((s) => s.addContract);
  const updateContract = useAppStore((s) => s.updateContract);

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(() => {
    if (editing) {
      const { id: _id, ...rest } = editing;
      void _id;
      return rest;
    }
    return emptyDraft(defaultAssetId ?? assets[0]?.id ?? "");
  });

  function patch(p: Partial<Draft>) {
    setDraft((d) => ({ ...d, ...p }));
  }
  function patchTime(p: Partial<Draft["timeWindow"]>) {
    setDraft((d) => ({ ...d, timeWindow: { ...d.timeWindow, ...p } }));
  }

  function onTypeChange(type: string) {
    patch({ type, parameters: defaultParams(paramsKindFor(type)) });
  }

  function handleSave() {
    const finalized: Draft = {
      ...draft,
      subtitle: draft.subtitle || draft.supplier,
    };
    if (editing) {
      updateContract(editing.id, finalized);
    } else {
      addContract({ ...finalized, id: nextId("contract") });
    }
    onOpenChange(false);
  }

  const assetName = assets.find((a) => a.id === draft.assetId)?.name ?? "Unknown";
  const canProceed = step < STEPS.length - 1;

  return (
    <SidePanel open={open} onOpenChange={onOpenChange} labelledBy="contract-wizard-title">
      <div className="flex h-full flex-col">
        <div className="border-b p-5 pr-12">
          <h2 id="contract-wizard-title" className="text-base font-medium">
            {editing ? "Update Contract" : "New Contract"}
            {draft.name ? `: ${draft.name}` : ""}
          </h2>
          <div className="pt-4">
            <Stepper steps={STEPS} current={step} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {step === 0 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Contract Name" className="col-span-2">
                <Input
                  value={draft.name}
                  onChange={(e) => patch({ name: e.target.value })}
                  placeholder="Day-Ahead Spot Contract July"
                />
              </Field>
              <Field label="Asset">
                <NativeSelect
                  value={draft.assetId}
                  onChange={(e) => patch({ assetId: e.target.value })}
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
                  value={draft.supplier}
                  onChange={(e) => patch({ supplier: e.target.value })}
                  placeholder="X"
                />
              </Field>
              <Field label="Contract Type" className="col-span-2">
                <NativeSelect
                  value={draft.type}
                  onChange={(e) => onTypeChange(e.target.value)}
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
                  value={draft.startDate}
                  onChange={(e) => patch({ startDate: e.target.value })}
                />
              </Field>
              <Field label="End Date">
                <Input
                  type="date"
                  value={draft.endDate}
                  onChange={(e) => patch({ endDate: e.target.value })}
                />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Parameters for{" "}
                <span className="font-medium text-foreground">
                  {contractTypeLabel(draft.type)}
                </span>
              </p>
              <ContractParamsFields
                params={draft.parameters}
                onChange={(parameters) => patch({ parameters })}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Field label="Time Window">
                <NativeSelect
                  value={draft.timeWindow.mode}
                  onChange={(e) =>
                    patchTime({ mode: e.target.value as "always" | "custom" })
                  }
                >
                  <option value="always">Always</option>
                  <option value="custom">Custom time window</option>
                </NativeSelect>
              </Field>

              {draft.timeWindow.mode === "custom" && (
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Start Time (inclusive)">
                    <Input
                      value={draft.timeWindow.startTime}
                      onChange={(e) => patchTime({ startTime: e.target.value })}
                      placeholder="09:00:00"
                    />
                  </Field>
                  <Field label="End Time (exclusive)">
                    <Input
                      value={draft.timeWindow.endTime}
                      onChange={(e) => patchTime({ endTime: e.target.value })}
                      placeholder="17:00:01"
                    />
                  </Field>
                  <Field label="Days of the Week" className="col-span-2">
                    <DayPicker
                      days={DAYS_OF_WEEK}
                      value={draft.timeWindow.daysOfWeek}
                      onChange={(next) =>
                        patchTime({
                          daysOfWeek:
                            next as Draft["timeWindow"]["daysOfWeek"],
                        })
                      }
                    />
                  </Field>
                  <Field label="Range Inclusion">
                    <NativeSelect
                      value={draft.timeWindow.rangeInclusion}
                      onChange={(e) =>
                        patchTime({
                          rangeInclusion: e.target.value as
                            | "Within"
                            | "Outside",
                        })
                      }
                    >
                      <option value="Within">Within</option>
                      <option value="Outside">Outside</option>
                    </NativeSelect>
                  </Field>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <ReviewCard title="Contract Information">
                <ReviewRow label="Contract Name" value={draft.name || "-"} />
                <ReviewRow label="Asset" value={assetName} />
                <ReviewRow label="Supplier" value={draft.supplier || "-"} />
                <ReviewRow label="Type" value={contractTypeLabel(draft.type)} />
                <ReviewRow label="Category" value={contractCategory(draft.type)} />
                <ReviewRow label="Start Date" value={formatDate(draft.startDate)} />
                <ReviewRow label="End Date" value={formatDate(draft.endDate)} />
              </ReviewCard>
              <ReviewCard title="Parameters">
                {paramSummaryRows(draft.parameters).map((r, i) => (
                  <ReviewRow key={i} label={r.label} value={r.value} />
                ))}
              </ReviewCard>
              <ReviewCard title="Time Configuration">
                <ReviewRow
                  label="Time Window"
                  value={draft.timeWindow.mode === "always" ? "Always" : "Custom"}
                />
                {draft.timeWindow.mode === "custom" && (
                  <>
                    <ReviewRow
                      label="Start Time (inclusive)"
                      value={draft.timeWindow.startTime}
                    />
                    <ReviewRow
                      label="End Time (exclusive)"
                      value={draft.timeWindow.endTime}
                    />
                    <ReviewRow
                      label="Days of the Week"
                      value={draft.timeWindow.daysOfWeek.join(", ") || "-"}
                    />
                    <ReviewRow
                      label="Range Inclusion"
                      value={draft.timeWindow.rangeInclusion}
                    />
                  </>
                )}
              </ReviewCard>
            </div>
          )}
        </div>

        <div className="flex flex-row items-center justify-between border-t p-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            )}
            {canProceed ? (
              <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
            ) : (
              <Button onClick={handleSave} disabled={!draft.name}>
                {editing ? "Save Contract" : "Create Contract"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </SidePanel>
  );
}

function ReviewCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <p className="mb-3 text-sm font-medium">{title}</p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>
    </Card>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
