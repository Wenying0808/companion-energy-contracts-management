"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, FileText, LayoutList, Network } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/wizard/fields";
import { ContractsTable } from "@/components/contracts/contracts-table";
import { ContractGraph } from "@/components/contracts/contract-graph";
import { ContractWizard } from "@/components/contracts/contract-wizard";
import { ContractUploadPanel } from "@/components/contracts/contract-upload-panel";
import { ContractDraftReviewPanel } from "@/components/contracts/contract-draft-review-panel";
import { AddContractMenu } from "@/components/contracts/add-contract-menu";
import {
  applyContractFilters,
  ContractFilters,
  EMPTY_FILTERS,
  type ContractFiltersState,
} from "@/components/contracts/contract-filters";
import { useAppStore } from "@/lib/store";
import { useDeferredOpen } from "@/lib/use-deferred-open";
import { cn } from "@/lib/utils";
import type { Asset, Contract, DraftContract } from "@/lib/types";

type ContractView = "table" | "graph";

function assetFilterFromParam(
  param: string | null,
  assets: Asset[],
): string[] {
  if (!param) return [];
  const byId = assets.find((a) => a.id === param);
  if (byId) return [byId.id];
  const byName = assets.find((a) => a.name === param);
  if (byName) return [byName.id];
  return [param];
}

export default function ContractsPage() {
  const searchParams = useSearchParams();
  const assetParam = searchParams.get("asset");
  // Remount when the URL asset filter changes so initial state picks it up.
  return <ContractsPageContent key={assetParam ?? ""} assetParam={assetParam} />;
}

function ContractsPageContent({ assetParam }: { assetParam: string | null }) {
  const contracts = useAppStore((s) => s.contracts);
  const assets = useAppStore((s) => s.assets);
  const removeContract = useAppStore((s) => s.removeContract);

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<ContractFiltersState>(() => ({
    ...EMPTY_FILTERS,
    asset: assetFilterFromParam(assetParam, assets),
  }));
  const { open: wizardOpen, setOpen: setWizardOpen, openDeferred } =
    useDeferredOpen();
  const {
    open: uploadOpen,
    setOpen: setUploadOpen,
    openDeferred: openUpload,
  } = useDeferredOpen();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [drafts, setDrafts] = useState<DraftContract[]>([]);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [view, setView] = useState<ContractView>("table");

  function handleDrafts(d: DraftContract[]) {
    setDrafts(d);
    setUploadOpen(false);
    setReviewOpen(true);
  }

  const addContractTooltip =
    "Contracts define how energy is priced and settled for an asset — supply (PPA), taxes & levies, hedges and spot.";

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const bySearch = q
      ? contracts.filter((c) => c.name.toLowerCase().includes(q))
      : contracts;
    return applyContractFilters(bySearch, filters);
  }, [contracts, query, filters]);

  function openNew() {
    openDeferred(() => setEditing(null));
  }
  function openEdit(c: Contract) {
    openDeferred(() => setEditing(c));
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b p-4">
        <div className="inline-flex rounded-lg border bg-muted/40 p-0.5">
          {([
            { key: "table", label: "Table", icon: LayoutList },
            { key: "graph", label: "Graph", icon: Network },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              aria-pressed={view === key}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                view === key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
        <div className="relative w-80 max-w-full">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contracts..."
            className="pl-9"
          />
        </div>
        <NativeSelect className="w-44" defaultValue="active">
          <option value="active">Active contracts</option>
          <option value="all">All contracts</option>
          <option value="expired">Expired contracts</option>
        </NativeSelect>
        <ContractFilters
          contracts={contracts}
          assets={assets}
          value={filters}
          onChange={setFilters}
        />
        <div className="ml-auto flex items-center gap-2">
        
          <AddContractMenu
            tooltip={addContractTooltip}
            onManual={openNew}
            onAiExtract={() => openUpload()}
          />
        </div>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-auto">
        {view === "table" ? (
          <ContractsTable
            contracts={filtered}
            assets={assets}
            onEdit={openEdit}
            onRemove={removeContract}
            emptyState={
              <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
                <FileText className="size-8 text-muted-foreground" />
                <p className="text-sm font-medium">No contracts yet</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Add a contract to get started. Contracts you create will appear here.
                </p>
                <div className="mt-2">
                  <AddContractMenu
                    align="start"
                    tooltip={addContractTooltip}
                    onManual={openNew}
                    onAiExtract={() => openUpload()}
                  />
                </div>
              </div>
            }
          />
        ) : (
          <ContractGraph contracts={filtered} assets={assets} />
        )}
      </div>

      {/* Footer (table view only) */}
      {view === "table" && (
        <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
          <span>
            Showing {filtered.length === 0 ? 0 : 1}-{filtered.length} of{" "}
            {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <NativeSelect className="w-20" defaultValue="50">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </NativeSelect>
            <span className="ml-2">1 of 1</span>
          </div>
        </div>
      )}

      {wizardOpen && (
        <ContractWizard
          open
          onOpenChange={setWizardOpen}
          editing={editing}
        />
      )}
      {uploadOpen && (
        <ContractUploadPanel
          open
          onOpenChange={setUploadOpen}
          onDrafts={handleDrafts}
        />
      )}
      {reviewOpen && (
        <ContractDraftReviewPanel
          open
          onOpenChange={setReviewOpen}
          drafts={drafts}
        />
      )}
    </div>
  );
}
