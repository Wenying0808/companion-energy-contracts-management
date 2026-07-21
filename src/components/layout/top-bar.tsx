"use client";

import { usePathname } from "next/navigation";
import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { titleForPath } from "./nav-config";

export function TopBar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const pathname = usePathname();
  const title = titleForPath(pathname);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
      >
        <PanelLeft className="size-4" />
      </Button>
      <div className="h-5 w-px bg-border" />
      <h1 className="text-base font-semibold">{title}</h1>
    </header>
  );
}
