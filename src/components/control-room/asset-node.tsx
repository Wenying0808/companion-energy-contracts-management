"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Plug, Sun, BatteryCharging, Wind } from "lucide-react";
import type { AssetType } from "@/lib/types";

const ICONS: Record<AssetType, React.ElementType> = {
  "Grid Connection": Plug,
  "Solar Panels": Sun,
  Battery: BatteryCharging,
  Wind: Wind,
};

export type AssetNodeData = {
  label: string;
  assetType: AssetType;
  badge?: string;
};

export function AssetNode({ data, selected }: NodeProps) {
  const d = data as AssetNodeData;
  const Icon = ICONS[d.assetType] ?? Plug;

  return (
    <div
      className={`min-w-52 rounded-xl border bg-card px-4 py-3 shadow-sm transition-shadow ${
        selected ? "border-primary ring-2 ring-primary/30" : "border-border"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!size-2 !border-2 !border-background !bg-muted-foreground"
      />
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">{d.label}</p>
          {d.badge && (
            <span className="mt-1 inline-block rounded-md bg-orange-500 px-2 py-0.5 text-xs font-medium text-white">
              {d.badge}
            </span>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!size-2 !border-2 !border-background !bg-muted-foreground"
      />
    </div>
  );
}
