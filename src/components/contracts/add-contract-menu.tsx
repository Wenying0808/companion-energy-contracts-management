"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, PenLine, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// A small, fully-controlled dropdown offering the two ways to add a contract.
// Built without a portal/Base-UI menu so open/close stays deterministic.
export function AddContractMenu({
  onManual,
  onAiExtract,
  label = "Add Contract",
  tooltip,
  size = "default",
  variant = "default",
  align = "end",
}: {
  onManual: () => void;
  onAiExtract: () => void;
  label?: string;
  tooltip?: string;
  size?: "default" | "sm";
  variant?: "default" | "outline";
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(fn: () => void) {
    setOpen(false);
    fn();
  }

  const trigger = (
    <Button
      size={size}
      variant={variant}
      onClick={() => setOpen((o) => !o)}
      aria-haspopup="menu"
      aria-expanded={open}
    >
      <Plus className="size-4" /> {label}
      <ChevronDown className="size-3.5 opacity-70" />
    </Button>
  );

  return (
    <div ref={ref} className="relative inline-block">
      {tooltip ? (
        <Tooltip>
          <TooltipTrigger render={trigger} />
          <TooltipContent side="bottom" className="max-w-xs text-center">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-50 mt-1.5 w-72 overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-md",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          <MenuItem
            icon={<PenLine className="size-4" />}
            title="Add manually"
            description="Fill in the contract details step by step."
            onClick={() => pick(onManual)}
          />
          <MenuItem
            icon={<Sparkles className="size-4" />}
            title="Extract from PDF (AI)"
            description="Upload signed contracts and let AI draft them for review."
            onClick={() => pick(onAiExtract)}
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-accent"
    >
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );
}
