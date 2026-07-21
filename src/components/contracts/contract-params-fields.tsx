"use client";

import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, NativeSelect } from "@/components/wizard/fields";
import type { ContractParameters } from "@/lib/types";

// Editable, per-type contract parameter fields. Shared by the contract wizard
// and the draft-review panel so both render identical inputs.
export function ContractParamsFields({
  params,
  onChange,
}: {
  params: ContractParameters;
  onChange: (p: ContractParameters) => void;
}) {
  switch (params.kind) {
    case "dayAheadSpot":
      return (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Contract Category">
            <NativeSelect
              value={params.category}
              onChange={(e) =>
                onChange({ ...params, category: e.target.value as "cost" | "revenue" })
              }
            >
              <option value="cost">Cost</option>
              <option value="revenue">Revenue</option>
            </NativeSelect>
          </Field>
          <Field label="Spot Product">
            <Input
              value={params.spotProduct}
              onChange={(e) => onChange({ ...params, spotProduct: e.target.value })}
              placeholder="BE - Spot"
            />
          </Field>
          <Field label="Constant (optional)">
            <Input
              value={params.constant}
              onChange={(e) => onChange({ ...params, constant: e.target.value })}
              placeholder="10.00 €/MWh"
            />
          </Field>
          <Field label="Scaling (optional)">
            <Input
              value={params.scaling}
              onChange={(e) => onChange({ ...params, scaling: e.target.value })}
              placeholder="2"
            />
          </Field>
          <Field label="Energy Direction">
            <NativeSelect
              value={params.energyDirection}
              onChange={(e) =>
                onChange({
                  ...params,
                  energyDirection: e.target.value as "Consumption" | "Injection",
                })
              }
            >
              <option value="Consumption">Consumption</option>
              <option value="Injection">Injection</option>
            </NativeSelect>
          </Field>
          <Field label="Contract Direction">
            <NativeSelect
              value={params.contractDirection}
              onChange={(e) =>
                onChange({
                  ...params,
                  contractDirection: e.target.value as
                    | "Buy"
                    | "Sell"
                    | "Not Applicable",
                })
              }
            >
              <option value="Buy">Buy</option>
              <option value="Sell">Sell</option>
              <option value="Not Applicable">Not Applicable</option>
            </NativeSelect>
          </Field>
        </div>
      );

    case "averageDayAheadSpot":
      return (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Period">
            <NativeSelect
              value={params.period}
              onChange={(e) =>
                onChange({
                  ...params,
                  period: e.target.value as typeof params.period,
                })
              }
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annually">Annually</option>
            </NativeSelect>
          </Field>
          <Field label="Contract Category">
            <NativeSelect
              value={params.category}
              onChange={(e) =>
                onChange({ ...params, category: e.target.value as "cost" | "revenue" })
              }
            >
              <option value="cost">Cost</option>
              <option value="revenue">Revenue</option>
            </NativeSelect>
          </Field>
          <Field label="Spot Product">
            <Input
              value={params.spotProduct}
              onChange={(e) => onChange({ ...params, spotProduct: e.target.value })}
              placeholder="BE - Spot"
            />
          </Field>
          <Field label="Constant (optional)">
            <Input
              value={params.constant}
              onChange={(e) => onChange({ ...params, constant: e.target.value })}
              placeholder="10.00 €/MWh"
            />
          </Field>
          <Field label="Scaling (optional)">
            <Input
              value={params.scaling}
              onChange={(e) => onChange({ ...params, scaling: e.target.value })}
              placeholder="2"
            />
          </Field>
          <Field label="Energy Direction">
            <NativeSelect
              value={params.energyDirection}
              onChange={(e) =>
                onChange({
                  ...params,
                  energyDirection: e.target.value as "Consumption" | "Injection",
                })
              }
            >
              <option value="Consumption">Consumption</option>
              <option value="Injection">Injection</option>
            </NativeSelect>
          </Field>
          <Field label="Contract Direction">
            <NativeSelect
              value={params.contractDirection}
              onChange={(e) =>
                onChange({
                  ...params,
                  contractDirection: e.target.value as
                    | "Buy"
                    | "Sell"
                    | "Not Applicable",
                })
              }
            >
              <option value="Buy">Buy</option>
              <option value="Sell">Sell</option>
              <option value="Not Applicable">Not Applicable</option>
            </NativeSelect>
          </Field>
        </div>
      );

    case "accessPower":
      return (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Access Capacity (kW, optional)">
            <Input
              value={params.accessCapacity}
              onChange={(e) =>
                onChange({ ...params, accessCapacity: e.target.value })
              }
              placeholder="e.g. 250"
            />
          </Field>
          <Field label="Regular Cost (€/kW)">
            <Input
              value={params.regularCost}
              onChange={(e) => onChange({ ...params, regularCost: e.target.value })}
              placeholder="e.g. 12.00 €/kW"
            />
          </Field>
        </div>
      );

    case "fixedHedge":
      return (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Hedge Basis">
            <NativeSelect
              value={params.hedgeBasis}
              onChange={(e) => {
                const hedgeBasis = e.target.value as "power" | "energy";
                onChange({
                  ...params,
                  hedgeBasis,
                  unit: hedgeBasis === "power" ? "kW" : "kWh",
                });
              }}
            >
              <option value="power">Power</option>
              <option value="energy">Energy</option>
            </NativeSelect>
          </Field>
          <Field label="Unit">
            <NativeSelect
              value={params.unit}
              onChange={(e) =>
                onChange({ ...params, unit: e.target.value as "kW" | "kWh" })
              }
            >
              <option value="kW">kW</option>
              <option value="kWh">kWh</option>
            </NativeSelect>
          </Field>
          <Field label="Price (€/MWh)">
            <Input
              value={params.price}
              onChange={(e) => onChange({ ...params, price: e.target.value })}
              placeholder="5.00 €/MWh"
            />
          </Field>
          <Field label="Energy Direction">
            <NativeSelect
              value={params.energyDirection}
              onChange={(e) =>
                onChange({
                  ...params,
                  energyDirection: e.target.value as "Consumption" | "Injection",
                })
              }
            >
              <option value="Consumption">Consumption</option>
              <option value="Injection">Injection</option>
            </NativeSelect>
          </Field>
        </div>
      );

    case "fixedCost":
      return (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Cost (€/year)">
            <Input
              value={params.costPerYear}
              onChange={(e) => onChange({ ...params, costPerYear: e.target.value })}
              placeholder="€ 1,000.00"
            />
          </Field>
        </div>
      );

    case "energyTax":
      return (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Price (€/MWh)">
            <Input
              value={params.price}
              onChange={(e) => onChange({ ...params, price: e.target.value })}
              placeholder="1.00 €/MWh"
            />
          </Field>
          <Field label="Energy Direction">
            <NativeSelect
              value={params.energyDirection}
              onChange={(e) =>
                onChange({
                  ...params,
                  energyDirection: e.target.value as "Consumption" | "Injection",
                })
              }
            >
              <option value="Consumption">Consumption</option>
              <option value="Injection">Injection</option>
            </NativeSelect>
          </Field>
        </div>
      );

    case "ppa":
      return (
        <div className="grid grid-cols-2 gap-4">
          <Field label="PPA Type">
            <NativeSelect
              value={params.ppaType}
              onChange={(e) =>
                onChange({
                  ...params,
                  ppaType: e.target.value as
                    | "pay as consumed"
                    | "pay as produced",
                })
              }
            >
              <option value="pay as consumed">Pay as consumed</option>
              <option value="pay as produced">Pay as produced</option>
            </NativeSelect>
          </Field>
          <Field label="Meter Location">
            <NativeSelect
              value={params.meterLocation}
              onChange={(e) =>
                onChange({
                  ...params,
                  meterLocation: e.target.value as "onsite" | "offsite",
                })
              }
            >
              <option value="onsite">Onsite</option>
              <option value="offsite">Offsite</option>
            </NativeSelect>
          </Field>
          <Field label="Price (€/MWh)">
            <Input
              value={params.price}
              onChange={(e) => onChange({ ...params, price: e.target.value })}
              placeholder="45.00 €/MWh"
            />
          </Field>
          <Field label="Producing Asset">
            <Input
              value={params.producingAsset}
              onChange={(e) =>
                onChange({ ...params, producingAsset: e.target.value })
              }
              placeholder="Solar Panels"
            />
          </Field>
          <Field label="Quantity Scaling">
            <Input
              value={params.quantityScaling}
              onChange={(e) =>
                onChange({ ...params, quantityScaling: e.target.value })
              }
              placeholder="1"
            />
          </Field>
        </div>
      );

    case "generic":
      return (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            This contract type doesn&apos;t have a dedicated form yet. Capture its
            parameters as key/value pairs.
          </p>
          {params.fields.map((f, i) => (
            <div key={i} className="flex items-end gap-2">
              <Field label="Label" className="flex-1">
                <Input
                  value={f.label}
                  onChange={(e) => {
                    const fields = [...params.fields];
                    fields[i] = { ...fields[i], label: e.target.value };
                    onChange({ ...params, fields });
                  }}
                  placeholder="e.g. Price"
                />
              </Field>
              <Field label="Value" className="flex-1">
                <Input
                  value={f.value}
                  onChange={(e) => {
                    const fields = [...params.fields];
                    fields[i] = { ...fields[i], value: e.target.value };
                    onChange({ ...params, fields });
                  }}
                  placeholder="e.g. 12.00 €/MWh"
                />
              </Field>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove parameter"
                onClick={() =>
                  onChange({
                    ...params,
                    fields: params.fields.filter((_, j) => j !== i),
                  })
                }
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onChange({
                ...params,
                fields: [...params.fields, { label: "", value: "" }],
              })
            }
          >
            <Plus className="size-4" /> Add parameter
          </Button>
        </div>
      );
  }
}

// Read-only summary rows for the review step.
export function paramSummaryRows(
  p: ContractParameters,
): { label: string; value: string }[] {
  switch (p.kind) {
    case "dayAheadSpot":
      return [
        { label: "Contract Category", value: p.category },
        { label: "Spot Product", value: p.spotProduct || "-" },
        { label: "Constant", value: p.constant || "-" },
        { label: "Scaling", value: p.scaling || "-" },
        { label: "Energy Direction", value: p.energyDirection },
        { label: "Contract Direction", value: p.contractDirection },
      ];
    case "averageDayAheadSpot":
      return [
        { label: "Period", value: p.period },
        { label: "Contract Category", value: p.category },
        { label: "Spot Product", value: p.spotProduct || "-" },
        { label: "Constant", value: p.constant || "-" },
        { label: "Scaling", value: p.scaling || "-" },
        { label: "Energy Direction", value: p.energyDirection },
        { label: "Contract Direction", value: p.contractDirection },
      ];
    case "accessPower":
      return [
        { label: "Access Capacity", value: p.accessCapacity ? `${p.accessCapacity} kW` : "-" },
        { label: "Regular Cost", value: p.regularCost || "-" },
      ];
    case "fixedHedge":
      return [
        { label: "Hedge Basis", value: p.hedgeBasis },
        { label: "Unit", value: p.unit },
        { label: "Price", value: p.price || "-" },
        { label: "Energy Direction", value: p.energyDirection },
      ];
    case "fixedCost":
      return [{ label: "Cost / year", value: p.costPerYear || "-" }];
    case "energyTax":
      return [
        { label: "Price", value: p.price || "-" },
        { label: "Energy Direction", value: p.energyDirection },
      ];
    case "ppa":
      return [
        { label: "PPA Type", value: p.ppaType },
        { label: "Meter Location", value: p.meterLocation },
        { label: "Price", value: p.price || "-" },
        { label: "Producing Asset", value: p.producingAsset || "-" },
        { label: "Quantity Scaling", value: p.quantityScaling || "1" },
      ];
    case "generic":
      return p.fields.length
        ? p.fields.map((f) => ({ label: f.label || "-", value: f.value || "-" }))
        : [{ label: "Parameters", value: "-" }];
  }
}
