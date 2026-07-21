"use client";

import { useMemo, useState } from "react";
import { Filter, Search, MoreVertical, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/wizard/fields";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ContractWizard } from "@/components/contracts/contract-wizard";
import { ContractUploadPanel } from "@/components/contracts/contract-upload-panel";
import { AddContractMenu } from "@/components/contracts/add-contract-menu";
import { useAppStore } from "@/lib/store";
import { useDeferredOpen } from "@/lib/use-deferred-open";
import { formatDate, formatTimeWindow } from "@/lib/format";
import type { Contract } from "@/lib/types";

export default function ContractsPage() {
  const contracts = useAppStore((s) => s.contracts);
  const assets = useAppStore((s) => s.assets);
  const removeContract = useAppStore((s) => s.removeContract);

  const [query, setQuery] = useState("");
  const { open: wizardOpen, setOpen: setWizardOpen, openDeferred } =
    useDeferredOpen();
  const {
    open: uploadOpen,
    setOpen: setUploadOpen,
    openDeferred: openUpload,
  } = useDeferredOpen();
  const [editing, setEditing] = useState<Contract | null>(null);

  const addContractTooltip =
    "Contracts define how energy is priced and settled for an asset — supply (PPA), taxes & levies, hedges and spot.";

  const assetName = (id: string) =>
    assets.find((a) => a.id === id)?.name ?? "-";

  const filtered = useMemo(
    () =>
      contracts.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [contracts, query],
  );

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
        <Button variant="outline" size="icon" aria-label="Filter">
          <Filter className="size-4" />
        </Button>
        <div className="ml-auto">
          <AddContractMenu
            tooltip={addContractTooltip}
            onManual={openNew}
            onAiExtract={() => openUpload()}
          />
        </div>
      </div>

      {/* Table */}
      <div className="min-h-0 flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Time Window</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>Parameters</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11}>
                  <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
                    <FileText className="size-8 text-muted-foreground" />
                    <p className="text-sm font-medium">No contracts yet</p>
                    <p className="max-w-sm text-sm text-muted-foreground">
                      Add a contract to get started. Contracts you create will
                      appear here.
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
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium">{c.name}</div>
                    {c.subtitle && (
                      <div className="text-xs text-muted-foreground">
                        {c.subtitle}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{assetName(c.assetId)}</TableCell>
                  <TableCell>{c.group}</TableCell>
                  <TableCell>{c.category}</TableCell>
                  <TableCell>
                    <div>{c.type}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.subType}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(c.startDate)}</TableCell>
                  <TableCell>{formatDate(c.endDate)}</TableCell>
                  <TableCell className="max-w-40 truncate">
                    {formatTimeWindow(c)}
                  </TableCell>
                  <TableCell>{c.volume}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono font-normal">
                      {c.parametersDisplay}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon" aria-label="Row actions" />
                        }
                      >
                        <MoreVertical className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(c)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => removeContract(c.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
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

      {wizardOpen && (
        <ContractWizard
          open
          onOpenChange={setWizardOpen}
          editing={editing}
        />
      )}
      {uploadOpen && (
        <ContractUploadPanel open onOpenChange={setUploadOpen} />
      )}
    </div>
  );
}
