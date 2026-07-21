"use client";

import { useMemo, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssetNode, type AssetNodeData } from "@/components/control-room/asset-node";
import { AssetDetailPanel } from "@/components/control-room/asset-detail-panel";
import { AssetWizard } from "@/components/assets/asset-wizard";
import { ContractWizard } from "@/components/contracts/contract-wizard";
import { ContractUploadPanel } from "@/components/contracts/contract-upload-panel";
import { useAppStore } from "@/lib/store";
import { useDeferredOpen } from "@/lib/use-deferred-open";
import type { Asset } from "@/lib/types";

const nodeTypes = { asset: AssetNode };

function ControlRoomInner() {
  const assets = useAppStore((s) => s.assets);

  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const {
    open: assetWizardOpen,
    setOpen: setAssetWizardOpen,
    openDeferred: openAssetWizard,
  } = useDeferredOpen();
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const {
    open: contractWizardOpen,
    setOpen: setContractWizardOpen,
    openDeferred: openContractWizard,
  } = useDeferredOpen();
  const {
    open: uploadOpen,
    setOpen: setUploadOpen,
    openDeferred: openUpload,
  } = useDeferredOpen();

  const selectedAsset = assets.find((a) => a.id === selectedAssetId) ?? null;

  const nodes: Node<AssetNodeData>[] = useMemo(
    () =>
      assets.map((a) => ({
        id: a.id,
        type: "asset",
        position: a.position,
        data: {
          label: a.name,
          assetType: a.type,
          badge: a.type === "Solar Panels" ? "Solar Panels" : undefined,
        },
        selected: a.id === selectedAssetId,
      })),
    [assets, selectedAssetId],
  );

  // Connect the grid connection to every other asset (radial hub layout).
  const edges: Edge[] = useMemo(() => {
    const hub = assets.find((a) => a.type === "Grid Connection") ?? assets[0];
    if (!hub) return [];
    return assets
      .filter((a) => a.id !== hub.id)
      .map((a) => ({
        id: `${hub.id}-${a.id}`,
        source: hub.id,
        target: a.id,
        animated: true,
      }));
  }, [assets]);

  const onNodeClick: NodeMouseHandler = (_e, node) => {
    setSelectedAssetId(node.id);
  };

  function openAddAsset() {
    openAssetWizard(() => setEditingAsset(null));
  }
  function openEditAsset() {
    openAssetWizard(() => setEditingAsset(selectedAsset));
  }

  return (
    <div className="flex h-full">
      <div className="relative min-w-0 flex-1">
        {/* Toolbar overlay */}
        <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
          <Button size="icon" onClick={openAddAsset} aria-label="Add asset">
            <Plus className="size-4" />
          </Button>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onPaneClick={() => setSelectedAssetId(null)}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} />
          <Controls showInteractive={false} />
        </ReactFlow>

        {/* Bottom status bar */}
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-lg border bg-background px-4 py-2 text-sm shadow-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Pencil className="size-3.5" />
            View mode — click a node to inspect it
          </span>
        </div>
      </div>

      {selectedAsset && (
        <AssetDetailPanel
          asset={selectedAsset}
          onClose={() => setSelectedAssetId(null)}
          onAddContract={() => openContractWizard()}
          onAiExtract={() => openUpload()}
          onEdit={openEditAsset}
        />
      )}

      {assetWizardOpen && (
        <AssetWizard
          open
          onOpenChange={setAssetWizardOpen}
          editing={editingAsset}
        />
      )}
      {contractWizardOpen && (
        <ContractWizard
          open
          onOpenChange={setContractWizardOpen}
          defaultAssetId={selectedAsset?.id}
        />
      )}
      {uploadOpen && (
        <ContractUploadPanel
          open
          onOpenChange={setUploadOpen}
          defaultAssetId={selectedAsset?.id}
        />
      )}
    </div>
  );
}

export default function ControlRoomPage() {
  return (
    <ReactFlowProvider>
      <ControlRoomInner />
    </ReactFlowProvider>
  );
}
