"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { contractCategory, contractTypeLabel } from "@/lib/contract-types";
import { contractGroup } from "@/lib/format";
import type { Asset, Contract } from "@/lib/types";
import { cn } from "@/lib/utils";

export type FilterKey =
  | "type"
  | "asset"
  | "supplier"
  | "group"
  | "category";

export type ContractFiltersState = Record<FilterKey, string[]>;

export const EMPTY_FILTERS: ContractFiltersState = {
  type: [],
  asset: [],
  supplier: [],
  group: [],
  category: [],
};

const FILTER_DEFS: {
  key: FilterKey;
  label: string;
  chipLabel: string;
}[] = [
  { key: "type", label: "Contract Type", chipLabel: "Type" },
  { key: "asset", label: "Asset", chipLabel: "Asset" },
  { key: "supplier", label: "Supplier", chipLabel: "Supplier" },
  { key: "group", label: "Group", chipLabel: "Group" },
  { key: "category", label: "Category", chipLabel: "Category" },
];

type Option = { value: string; label: string };

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function buildOptions(
  contracts: Contract[],
  assets: Asset[],
): Record<FilterKey, Option[]> {
  const assetName = (id: string) =>
    assets.find((a) => a.id === id)?.name ?? id;

  return {
    type: uniqueSorted(contracts.map((c) => c.type)).map((value) => ({
      value,
      label: contractTypeLabel(value),
    })),
    asset: uniqueSorted(contracts.map((c) => c.assetId)).map((value) => ({
      value,
      label: assetName(value),
    })),
    supplier: uniqueSorted(contracts.map((c) => c.supplier)).map((value) => ({
      value,
      label: value,
    })),
    group: uniqueSorted(contracts.map((c) => contractGroup(c.parameters))).map(
      (value) => ({ value, label: value }),
    ),
    category: uniqueSorted(
      contracts.map((c) => contractCategory(c.type)),
    ).map((value) => ({ value, label: value })),
  };
}

export function applyContractFilters(
  contracts: Contract[],
  filters: ContractFiltersState,
): Contract[] {
  return contracts.filter((c) => {
    if (filters.type.length > 0 && !filters.type.includes(c.type)) return false;
    if (filters.asset.length > 0 && !filters.asset.includes(c.assetId))
      return false;
    if (filters.supplier.length > 0 && !filters.supplier.includes(c.supplier))
      return false;
    if (
      filters.group.length > 0 &&
      !filters.group.includes(contractGroup(c.parameters))
    )
      return false;
    if (
      filters.category.length > 0 &&
      !filters.category.includes(contractCategory(c.type))
    )
      return false;
    return true;
  });
}

export function hasActiveFilters(filters: ContractFiltersState): boolean {
  return FILTER_DEFS.some((d) => filters[d.key].length > 0);
}

function optionLabel(
  options: Option[],
  value: string,
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

export function ContractFilters({
  contracts,
  assets,
  value,
  onChange,
}: {
  contracts: Contract[];
  assets: Asset[];
  value: ContractFiltersState;
  onChange: (next: ContractFiltersState) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FilterKey | null>(null);
  const [draft, setDraft] = useState<string[]>([]);

  const options = useMemo(
    () => buildOptions(contracts, assets),
    [contracts, assets],
  );

  const active = hasActiveFilters(value);

  function openDimension(key: FilterKey) {
    setDraft([...value[key]]);
    setEditing(key);
  }

  function cancelEdit() {
    setEditing(null);
    setDraft([]);
  }

  function applyEdit() {
    if (!editing) return;
    onChange({ ...value, [editing]: draft });
    setEditing(null);
    setDraft([]);
  }

  function clearAll() {
    onChange({ ...EMPTY_FILTERS });
    cancelEdit();
  }

  function removeFilter(key: FilterKey) {
    onChange({ ...value, [key]: [] });
    if (editing === key) cancelEdit();
  }

  function toggleDraft(optionValue: string) {
    setDraft((prev) =>
      prev.includes(optionValue)
        ? prev.filter((v) => v !== optionValue)
        : [...prev, optionValue],
    );
  }

  const editingDef = FILTER_DEFS.find((d) => d.key === editing);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) cancelEdit();
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            aria-label="Filter"
            className="relative"
          />
        }
      >
        <Filter className="size-4" />
        {active && (
          <span
            aria-hidden
            className="absolute top-1 right-1 size-1.5 rounded-full bg-primary"
          />
        )}
      </PopoverTrigger>

      <PopoverContent align="start" className="w-80 gap-0 p-0">
        <PopoverHeader className="flex flex-row items-center justify-between gap-2 px-3 py-2.5">
          <PopoverTitle className="text-sm font-semibold">Filters</PopoverTitle>
          <button
            type="button"
            onClick={clearAll}
            disabled={!active}
            className="text-sm text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            Clear all
          </button>
        </PopoverHeader>

        <div className="px-3 pb-3">
          {editing && editingDef ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{editingDef.label}</span>
                <button
                  type="button"
                  onClick={cancelEdit}
                  aria-label="Close filter"
                  className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </div>
              <div className="space-y-1.5">
                <div className="text-xs text-muted-foreground">Value</div>
                <div className="max-h-52 overflow-y-auto rounded-md border">
                  {options[editing].length === 0 ? (
                    <p className="px-3 py-4 text-sm text-muted-foreground">
                      No values available
                    </p>
                  ) : (
                    <ul className="py-1">
                      {options[editing].map((opt) => {
                        const checked = draft.includes(opt.value);
                        return (
                          <li key={opt.value}>
                            <label className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-muted/60">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() => toggleDraft(opt.value)}
                              />
                              <span className="truncate">{opt.label}</span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={cancelEdit}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={applyEdit}>
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Select a filter</div>
              <div className="space-y-1.5">
                {FILTER_DEFS.map((def) => (
                  <button
                    key={def.key}
                    type="button"
                    onClick={() => openDimension(def.key)}
                    className={cn(
                      "flex h-9 w-full items-center justify-between rounded-md border bg-background px-3 text-left text-sm",
                      "hover:bg-muted/50",
                      value[def.key].length > 0 && "border-foreground/20",
                    )}
                  >
                    <span
                      className={
                        value[def.key].length > 0
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      {def.label}
                      {value[def.key].length > 0
                        ? ` (${value[def.key].length})`
                        : ""}
                    </span>
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {active && (
          <>
            <Separator />
            <div className="space-y-2 px-3 py-3">
              <div className="text-xs text-muted-foreground">Active Filters</div>
              <div className="flex flex-col gap-1.5">
                {FILTER_DEFS.filter((d) => value[d.key].length > 0).map(
                  (def) => {
                    const labels = value[def.key].map((v) =>
                      optionLabel(options[def.key], v),
                    );
                    return (
                      <div
                        key={def.key}
                        className="flex items-center gap-2 rounded-md bg-muted px-2.5 py-1.5 text-sm"
                      >
                        <span className="min-w-0 flex-1 truncate">
                          <span className="font-medium">{def.chipLabel}</span>
                          {" is one of "}
                          <span className="font-medium">
                            {labels.join(", ")}
                          </span>
                        </span>
                        <button
                          type="button"
                          aria-label={`Remove ${def.label} filter`}
                          onClick={() => removeFilter(def.key)}
                          className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
