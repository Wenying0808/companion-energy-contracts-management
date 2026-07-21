import {
  LayoutGrid,
  FileText,
  BarChart3,
  Zap,
  DollarSign,
  Leaf,
  PiggyBank,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href?: string; // only wired items have a route; others are placeholders
  icon: LucideIcon;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "System",
    items: [
      { label: "Control Room", href: "/control-room", icon: LayoutGrid },
      { label: "Contracts", href: "/contracts", icon: FileText },
      { label: "Market Data", icon: BarChart3 },
    ],
  },
  {
    title: "Insights",
    items: [
      { label: "Energy", icon: Zap },
      { label: "Financial", icon: DollarSign },
      { label: "Sustainability", icon: Leaf },
    ],
  },
  {
    title: "Flexibility",
    items: [
      { label: "Savings", icon: PiggyBank },
      { label: "Forecasts", icon: TrendingUp },
    ],
  },
];

export function titleForPath(pathname: string): string {
  if (pathname.startsWith("/contracts")) return "Contracts";
  if (pathname.startsWith("/control-room")) return "Control Room";
  return "Control Room";
}
