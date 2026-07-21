"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

const controlClasses =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

export function NativeSelect({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlClasses, "cursor-pointer", className)} {...props}>
      {children}
    </select>
  );
}

export function DayPicker({
  value,
  onChange,
  days,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  days: readonly string[];
}) {
  function toggle(day: string) {
    onChange(
      value.includes(day) ? value.filter((d) => d !== day) : [...value, day],
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {days.map((day) => {
        const active = value.includes(day);
        return (
          <button
            key={day}
            type="button"
            onClick={() => toggle(day)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs capitalize transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input text-muted-foreground hover:bg-accent",
            )}
          >
            {day.slice(0, 3)}
          </button>
        );
      })}
    </div>
  );
}
