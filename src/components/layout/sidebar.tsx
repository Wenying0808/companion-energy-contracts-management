"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Zap,
  Settings,
  Headphones,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS } from "./nav-config";

const FOOTER_ITEMS = [
  { label: "Settings", icon: Settings },
  { label: "Contact Support", icon: Headphones },
  { label: "Submit Feedback", icon: MessageSquare },
];

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();

  if (collapsed) return null;

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r bg-background">
      {/* Brand */}
      <div className="flex items-center gap-2 px-5 py-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Zap className="size-4" />
        </div>
        <span className="text-lg font-semibold tracking-tight">TEST</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-5">
            <p className="px-2 pb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  item.href && pathname.startsWith(item.href);
                const Icon = item.icon;
                const content = (
                  <span
                    className={cn(
                      "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
                      active
                        ? "bg-accent font-medium text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                      !item.href && "cursor-default opacity-70",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {item.label}
                  </span>
                );
                return (
                  <li key={item.label}>
                    {item.href ? (
                      <Link href={item.href}>{content}</Link>
                    ) : (
                      content
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t px-3 py-3">
        <ul className="space-y-0.5">
          {FOOTER_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <span className="flex cursor-default items-center gap-3 rounded-md px-2.5 py-2 text-sm text-muted-foreground opacity-70">
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-2 flex items-center gap-3 rounded-md px-2.5 py-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
            WC
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">Wen-Ying Chang</p>
            <p className="truncate text-xs text-muted-foreground">
              changwenyingbe@gmail.com
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
