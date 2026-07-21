"use client";

import { useState } from "react";
import { SidePanel } from "@/components/ui/side-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Stepper } from "@/components/wizard/stepper";
import { Field, NativeSelect } from "@/components/wizard/fields";
import { useAppStore, nextId } from "@/lib/store";
import type { Asset, AssetType } from "@/lib/types";

const STEPS = [
  { key: "basic", label: "Basic Information" },
  { key: "config", label: "Asset Configuration" },
  { key: "integration", label: "Integration Configuration" },
  { key: "summary", label: "Summary" },
];

const ASSET_TYPES: AssetType[] = [
  "Grid Connection",
  "Solar Panels",
  "Battery",
  "Wind",
];

type Draft = Omit<Asset, "id" | "position">;

function emptyDraft(): Draft {
  return {
    name: "",
    type: "Grid Connection",
    location: "",
    dso: "Fluvius",
    dsoRegion: "Imewo",
    dsoConnectionType: "-",
    physicalPowerInjection: "-",
    physicalPowerConsumption: "-",
    nominate: false,
    integration: {
      apiIntegration: true,
      dataGranularity: "15 minutes",
      integrationFrequency: "batch",
    },
  };
}

export function AssetWizard({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Asset | null;
}) {
  const addAsset = useAppStore((s) => s.addAsset);
  const updateAsset = useAppStore((s) => s.updateAsset);

  const [step, setStep] = useState(0);
  // The wizard mounts fresh each time it opens, so initial state can be derived
  // directly from props — no reset effect needed.
  const [draft, setDraft] = useState<Draft>(() => {
    if (editing) {
      const { id: _id, position: _pos, ...rest } = editing;
      void _id;
      void _pos;
      return rest;
    }
    return emptyDraft();
  });

  function patch(p: Partial<Draft>) {
    setDraft((d) => ({ ...d, ...p }));
  }
  function patchIntegration(p: Partial<Draft["integration"]>) {
    setDraft((d) => ({ ...d, integration: { ...d.integration, ...p } }));
  }

  function handleSave() {
    if (editing) {
      updateAsset(editing.id, draft);
    } else {
      addAsset({
        ...draft,
        id: nextId("asset"),
        position: { x: 120, y: 360 + Math.round(Math.abs(Math.sin(step)) * 40) },
      });
    }
    onOpenChange(false);
  }

  const isLast = step === STEPS.length - 1;

  return (
    <SidePanel open={open} onOpenChange={onOpenChange} labelledBy="asset-wizard-title">
      <div className="flex h-full flex-col">
        <div className="border-b p-5 pr-12">
          <h2 id="asset-wizard-title" className="text-base font-medium">
            {editing ? "Edit Asset" : "New Asset"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {editing ? "Update asset configuration" : "Create a new asset"}
          </p>
          <div className="pt-4">
            <Stepper steps={STEPS} current={step} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {step === 0 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Name" className="col-span-2">
                <Input
                  value={draft.name}
                  onChange={(e) => patch({ name: e.target.value })}
                  placeholder="Grid Connection"
                />
              </Field>
              <Field label="Location" className="col-span-2">
                <Input
                  value={draft.location}
                  onChange={(e) => patch({ location: e.target.value })}
                  placeholder="Ottergemsesteenweg Zuid 808/b300, 9000 Gent, Belgium"
                />
              </Field>
              <Field label="Type">
                <NativeSelect
                  value={draft.type}
                  onChange={(e) =>
                    patch({ type: e.target.value as AssetType })
                  }
                >
                  {ASSET_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="DSO">
                <Input
                  value={draft.dso}
                  onChange={(e) => patch({ dso: e.target.value })}
                />
              </Field>
              <Field label="DSO Region">
                <Input
                  value={draft.dsoRegion}
                  onChange={(e) => patch({ dsoRegion: e.target.value })}
                />
              </Field>
              <Field label="DSO Connection Type">
                <Input
                  value={draft.dsoConnectionType}
                  onChange={(e) =>
                    patch({ dsoConnectionType: e.target.value })
                  }
                />
              </Field>
              <Field label="Physical Power Injection (kW)">
                <Input
                  value={draft.physicalPowerInjection}
                  onChange={(e) =>
                    patch({ physicalPowerInjection: e.target.value })
                  }
                />
              </Field>
              <Field label="Physical Power Consumption (kW)">
                <Input
                  value={draft.physicalPowerConsumption}
                  onChange={(e) =>
                    patch({ physicalPowerConsumption: e.target.value })
                  }
                />
              </Field>
              <Field label="Nominate This Grid Connection">
                <NativeSelect
                  value={draft.nominate ? "yes" : "no"}
                  onChange={(e) =>
                    patch({ nominate: e.target.value === "yes" })
                  }
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </NativeSelect>
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="API Integration">
                <NativeSelect
                  value={draft.integration.apiIntegration ? "yes" : "no"}
                  onChange={(e) =>
                    patchIntegration({
                      apiIntegration: e.target.value === "yes",
                    })
                  }
                >
                  <option value="yes">Enabled</option>
                  <option value="no">Disabled</option>
                </NativeSelect>
              </Field>
              <Field label="Data Granularity">
                <NativeSelect
                  value={draft.integration.dataGranularity}
                  onChange={(e) =>
                    patchIntegration({ dataGranularity: e.target.value })
                  }
                >
                  <option value="15 minutes">15 minutes</option>
                  <option value="30 minutes">30 minutes</option>
                  <option value="1 hour">1 hour</option>
                </NativeSelect>
              </Field>
              <Field label="Integration Frequency">
                <NativeSelect
                  value={draft.integration.integrationFrequency}
                  onChange={(e) =>
                    patchIntegration({ integrationFrequency: e.target.value })
                  }
                >
                  <option value="batch">batch</option>
                  <option value="realtime">realtime</option>
                </NativeSelect>
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <SummaryCard title="Basic Information">
                <SummaryRow label="Name" value={draft.name || "-"} />
                <SummaryRow label="Location" value={draft.location || "-"} />
                <SummaryRow label="Type" value={draft.type} />
              </SummaryCard>
              <SummaryCard title="Configuration">
                <SummaryRow label="DSO" value={draft.dso} />
                <SummaryRow label="DSO Region" value={draft.dsoRegion} />
                <SummaryRow
                  label="DSO Connection Type"
                  value={draft.dsoConnectionType}
                />
                <SummaryRow
                  label="Physical Power Injection"
                  value={`${draft.physicalPowerInjection} kW`}
                />
                <SummaryRow
                  label="Physical Power Consumption"
                  value={`${draft.physicalPowerConsumption} kW`}
                />
                <SummaryRow
                  label="Nominate This Grid Connection"
                  value={draft.nominate ? "Yes" : "No"}
                />
              </SummaryCard>
              <SummaryCard title="Integrations">
                <SummaryRow
                  label="API Integration"
                  value={
                    draft.integration.apiIntegration ? "Enabled" : "Disabled"
                  }
                />
                <SummaryRow
                  label="Data Granularity"
                  value={draft.integration.dataGranularity}
                />
                <SummaryRow
                  label="Integration Frequency"
                  value={draft.integration.integrationFrequency}
                />
              </SummaryCard>
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
            {isLast ? (
              <Button onClick={handleSave} disabled={!draft.name}>
                {editing ? "Update" : "Create Asset"}
              </Button>
            ) : (
              <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
            )}
          </div>
        </div>
      </div>
    </SidePanel>
  );
}

function SummaryCard({
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
