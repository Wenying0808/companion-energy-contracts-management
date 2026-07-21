"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// A lightweight, fully-controlled right-hand slide-over. Content mounts only
// while `open` is true, so open/close is deterministic (no dependency on
// animation/transition-end callbacks) and each open animates fresh.
export function SidePanel(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  if (!props.open) return null;
  return <PanelInner {...props} />;
}

function PanelInner({
  onOpenChange,
  children,
  className,
  labelledBy,
}: {
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onOpenChange]);

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/20 transition-opacity duration-200",
          entered ? "opacity-100" : "opacity-0",
        )}
        onClick={() => onOpenChange(false)}
      />
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col bg-background shadow-xl transition-transform duration-200 ease-out",
          entered ? "translate-x-0" : "translate-x-full",
          className,
        )}
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
        >
          <X className="size-4" />
        </button>
        {children}
      </div>
    </div>
  );
}
