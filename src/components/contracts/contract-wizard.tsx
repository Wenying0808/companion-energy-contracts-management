"use client";

import { useState } from "react";
import { SidePanel } from "@/components/ui/side-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Stepper } from "@/components/wizard/stepper";
import { Field, NativeSelect, DayPicker } from "@/components/wizard/fields";
import { useAppStore, nextId } from "@/lib/store";
import { formatParameters, formatDate } from "@/lib/format";
import {
  CONTRACT_TYPE_META,
  DAYS_OF_WEEK,
  type Contract,
  type ContractType,
} from "@/lib/types";

const STEPS = [
  { key: "details", label: "Contract Details" },
  { key: "parameters", label: "Parameters" },
  { key: "timewindow", label: "Time Window" },
  { key: "review", label: "Review & Submit" },
];

type Draft = Omit<Contract, "id" | "parametersDisplay">;

function emptyDraft(assetId: string): Draft {
  return {
    name: "",
    subtitle: "",
    assetId,
    supplier: "",
    group: "Consumption",
    category: "Commodity",
    type: "Spot",
    subType: CONTRACT_TYPE_META.Spot.subTypes[0],
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    financial: {
      contractType: CONTRACT_TYPE_META.Spot.subTypes[0],
      spotProduct: "BE - Spot",
      constant: "10.00 €/MWh",
      scaling: "1",
      energyDirection: "Consumption",
      contractDirection: "Buy",
    },
    timeWindow: {
      startTime: "00:00:00",
      endTime: "24:00:00",
      daysOfWeek: [...DAYS_OF_WEEK],
      rangeInclusion: "Within",
    },
    volume: "-",
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
  // The wizard mounts fresh each time it opens, so initial state can be derived
  // directly from props — no reset effect needed.
  const [draft, setDraft] = useState<Draft>(() => {
    if (editing) {
      const { id: _id, parametersDisplay: _p, ...rest } = editing;
      void _id;
      void _p;
      return rest;
    }
    return emptyDraft(defaultAssetId ?? assets[0]?.id ?? "");
  });

  function patch(p: Partial<Draft>) {
    setDraft((d) => ({ ...d, ...p }));
  }
  function patchFinancial(p: Partial<Draft["financial"]>) {
    setDraft((d) => ({ ...d, financial: { ...d.financial, ...p } }));
  }
  function patchTime(p: Partial<Draft["timeWindow"]>) {
    setDraft((d) => ({ ...d, timeWindow: { ...d.timeWindow, ...p } }));
  }

  function onTypeChange(type: ContractType) {
    const meta = CONTRACT_TYPE_META[type];
    patch({
      type,
      category: meta.defaultCategory,
      subType: meta.subTypes[0],
      financial: { ...draft.financial, contractType: meta.subTypes[0] },
    });
  }

  function handleSave() {
    const parametersDisplay = formatParameters(draft.financial);
    if (editing) {
      updateContract(editing.id, { ...draft, parametersDisplay });
    } else {
      addContract({ ...draft, id: nextId("contract"), parametersDisplay });
    }
    onOpenChange(false);
  }

  const assetName =
    assets.find((a) => a.id === draft.assetId)?.name ?? "Unknown";
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
              <Field label="Type">
                <NativeSelect
                  value={draft.type}
                  onChange={(e) => onTypeChange(e.target.value as ContractType)}
                >
                  {(Object.keys(CONTRACT_TYPE_META) as ContractType[]).map(
                    (t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ),
                  )}
                </NativeSelect>
              </Field>
              <Field label="Sub-type">
                <NativeSelect
                  value={draft.subType}
                  onChange={(e) =>
                    patch({
                      subType: e.target.value,
                      financial: {
                        ...draft.financial,
                        contractType: e.target.value,
                      },
                    })
                  }
                >
                  {CONTRACT_TYPE_META[draft.type].subTypes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Category">
                <NativeSelect
                  value={draft.category}
                  onChange={(e) =>
                    patch({
                      category: e.target.value as Draft["category"],
                    })
                  }
                >
                  <option value="Commodity">Commodity</option>
                  <option value="Grid & Regulated">Grid & Regulated</option>
                </NativeSelect>
              </Field>
              <Field label="Group">
                <Input
                  value={draft.group}
                  onChange={(e) => patch({ group: e.target.value })}
                />
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
            <div className="grid grid-cols-2 gap-4">
              <Field label="Contract Type Label" className="col-span-2">
                <Input
                  value={draft.financial.contractType}
                  onChange={(e) =>
                    patchFinancial({ contractType: e.target.value })
                  }
                />
              </Field>
              <Field label="Spot Product">
                <Input
                  value={draft.financial.spotProduct}
                  onChange={(e) =>
                    patchFinancial({ spotProduct: e.target.value })
                  }
                  placeholder="BE - Spot or -"
                />
              </Field>
              <Field label="Constant">
                <Input
                  value={draft.financial.constant}
                  onChange={(e) =>
                    patchFinancial({ constant: e.target.value })
                  }
                  placeholder="10.00 €/MWh"
                />
              </Field>
              <Field label="Scaling">
                <Input
                  value={draft.financial.scaling}
                  onChange={(e) => patchFinancial({ scaling: e.target.value })}
                />
              </Field>
              <Field label="Volume">
                <Input
                  value={draft.volume}
                  onChange={(e) => patch({ volume: e.target.value })}
                  placeholder="1 MW or -"
                />
              </Field>
              <Field label="Energy Direction">
                <NativeSelect
                  value={draft.financial.energyDirection}
                  onChange={(e) =>
                    patchFinancial({
                      energyDirection: e.target
                        .value as Draft["financial"]["energyDirection"],
                    })
                  }
                >
                  <option value="Consumption">Consumption</option>
                  <option value="Injection">Injection</option>
                </NativeSelect>
              </Field>
              <Field label="Contract Direction">
                <NativeSelect
                  value={draft.financial.contractDirection}
                  onChange={(e) =>
                    patchFinancial({
                      contractDirection: e.target
                        .value as Draft["financial"]["contractDirection"],
                    })
                  }
                >
                  <option value="Buy">Buy</option>
                  <option value="Sell">Sell</option>
                </NativeSelect>
              </Field>
              <div className="col-span-2 rounded-md bg-muted/50 p-3 text-sm">
                <span className="text-muted-foreground">Preview: </span>
                <span className="font-mono">
                  {formatParameters(draft.financial)}
                </span>
              </div>
            </div>
          )}

          {step === 2 && (
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
                      daysOfWeek: next as Draft["timeWindow"]["daysOfWeek"],
                    })
                  }
                />
              </Field>
              <Field label="Range Inclusion">
                <NativeSelect
                  value={draft.timeWindow.rangeInclusion}
                  onChange={(e) =>
                    patchTime({
                      rangeInclusion: e.target
                        .value as Draft["timeWindow"]["rangeInclusion"],
                    })
                  }
                >
                  <option value="Within">Within</option>
                  <option value="Outside">Outside</option>
                </NativeSelect>
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <ReviewCard title="Contract Information">
                <ReviewRow label="Contract Name" value={draft.name || "-"} />
                <ReviewRow label="Asset" value={assetName} />
                <ReviewRow label="Supplier" value={draft.supplier || "-"} />
                <ReviewRow label="Category" value={draft.category} />
                <ReviewRow
                  label="Start Date"
                  value={formatDate(draft.startDate)}
                />
                <ReviewRow label="End Date" value={formatDate(draft.endDate)} />
              </ReviewCard>
              <ReviewCard title="Financial Parameters">
                <ReviewRow
                  label="Contract Type"
                  value={draft.financial.contractType}
                />
                <ReviewRow
                  label="Spot Product"
                  value={draft.financial.spotProduct}
                />
                <ReviewRow label="Constant" value={draft.financial.constant} />
                <ReviewRow label="Scaling" value={draft.financial.scaling} />
                <ReviewRow
                  label="Energy Direction"
                  value={draft.financial.energyDirection}
                />
                <ReviewRow
                  label="Contract Direction"
                  value={draft.financial.contractDirection}
                />
              </ReviewCard>
              <ReviewCard title="Time Configuration">
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
