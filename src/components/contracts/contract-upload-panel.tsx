"use client";

import { useRef, useState } from "react";
import { UploadCloud, FileText, X, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, NativeSelect } from "@/components/wizard/fields";
import { SidePanel } from "@/components/ui/side-panel";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import type { DraftContract } from "@/lib/types";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ContractUploadPanel({
  open,
  onOpenChange,
  defaultAssetId,
  onDrafts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultAssetId?: string;
  // Called with the drafted contracts returned by the extraction agent.
  onDrafts: (drafts: DraftContract[]) => void;
}) {
  const assets = useAppStore((s) => s.assets);

  const [assetId, setAssetId] = useState(defaultAssetId ?? assets[0]?.id ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const pdfs = Array.from(list).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
    );
    setFiles((prev) => {
      const seen = new Set(prev.map((f) => `${f.name}:${f.size}`));
      return [...prev, ...pdfs.filter((f) => !seen.has(`${f.name}:${f.size}`))];
    });
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleExtract() {
    setError(null);
    setLoading(true);
    try {
      const body = new FormData();
      body.append("assetId", assetId);
      files.forEach((f) => body.append("files", f));
      const res = await fetch("/api/extract-contracts", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Extraction failed. Please try again.");
        return;
      }
      onDrafts(data.drafts as DraftContract[]);
    } catch {
      setError("Could not reach the extraction service. Is the dev server running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SidePanel open={open} onOpenChange={onOpenChange} labelledBy="upload-title">
      <div className="flex h-full flex-col">
        <div className="border-b p-5 pr-12">
          <h2 id="upload-title" className="flex items-center gap-2 text-base font-medium">
            <Sparkles className="size-4 text-primary" />
            Extract Contracts from PDF
          </h2>
          <p className="text-xs text-muted-foreground">
            Upload one or more signed contracts (PDF). AI will draft contracts
            for you to review.
          </p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <Field label="Asset">
            <NativeSelect
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </NativeSelect>
          </Field>

          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
              dragging
                ? "border-primary bg-primary/5"
                : "border-input hover:bg-accent/40",
            )}
          >
            <UploadCloud className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              Drag &amp; drop PDFs here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              You can select multiple files. PDF only.
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {/* Selected files */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {files.length} file{files.length > 1 ? "s" : ""} selected
              </p>
              <ul className="space-y-1.5">
                {files.map((f, i) => (
                  <li
                    key={`${f.name}:${f.size}:${i}`}
                    className="flex items-center gap-3 rounded-md border p-2.5"
                  >
                    <FileText className="size-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{f.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatSize(f.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      aria-label={`Remove ${f.name}`}
                      className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                    >
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 rounded-md border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Reading {files.length} PDF{files.length > 1 ? "s" : ""} and drafting
              contracts…
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t p-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleExtract} disabled={files.length === 0 || loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Extract &amp; Review
          </Button>
        </div>
      </div>
    </SidePanel>
  );
}
