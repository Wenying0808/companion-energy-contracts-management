"use client";

import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Gauge,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AddContractMenu } from "@/components/contracts/add-contract-menu";
import type { Asset } from "@/lib/types";
import { useAppStore } from "@/lib/store";

export function AssetDetailPanel({
  asset,
  onClose,
  onAddContract,
  onAiExtract,
  onEdit,
}: {
  asset: Asset;
  onClose: () => void;
  onAddContract: () => void;
  onAiExtract: () => void;
  onEdit: () => void;
}) {
  const router = useRouter();
  const contracts = useAppStore((s) => s.contracts);
  const contractCount = contracts.filter((c) => c.assetId === asset.id).length;

  return (
    <div className="flex h-full w-[420px] shrink-0 flex-col border-l bg-background">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b p-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{asset.name}</h2>
          <p className="truncate text-sm text-muted-foreground">
            {asset.location || "-"}
          </p>
          <Badge variant="secondary" className="mt-2">
            {asset.type}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
          <X className="size-4" />
        </Button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-b p-4">
        <Button size="sm" variant="outline" onClick={onEdit}>
          Edit Asset
        </Button>
        <AddContractMenu
          size="sm"
          label="Add Contracts"
          align="start"
          tooltip={`Link supply, tax, hedge and spot contracts to ${asset.name} so its energy costs and volumes can be calculated.`}
          onManual={onAddContract}
          onAiExtract={onAiExtract}
        />
        {contractCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="ml-auto"
            onClick={() =>
              router.push(
                `/contracts?asset=${encodeURIComponent(asset.id)}`,
              )
            }
          >
            View {contractCount} Contract{contractCount === 1 ? "" : "s"}
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Date range control */}
        <div className="mb-4 flex items-center justify-between rounded-md border px-2 py-1.5 text-sm">
          <Button variant="ghost" size="icon" className="size-7">
            <ChevronLeft className="size-4" />
          </Button>
          <span className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="size-4" /> Jul 27, 2026 - Jul 31, 2026
          </span>
          <Button variant="ghost" size="icon" className="size-7">
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <ChartPlaceholder title="Power" />
        <ChartPlaceholder title="Energy (15min)" />
      </div>
    </div>
  );
}

function ChartPlaceholder({ title }: { title: string }) {
  return (
    <Card className="mb-4 p-4">
      <p className="mb-4 text-sm font-medium">{title}</p>
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <Gauge className="size-8 text-muted-foreground/50" />
        <p className="text-sm font-medium">No data available</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          No data is available for your current selection. Try adjusting the
          date range.
        </p>
      </div>
    </Card>
  );
}
