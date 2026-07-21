"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepperStep {
  key: string;
  label: string;
}

export function Stepper({
  steps,
  current,
}: {
  steps: StepperStep[];
  current: number; // index of the active step
}) {
  return (
    <div className="flex items-center">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                  done && "border-green-600 bg-green-600 text-white",
                  active && "border-primary bg-primary/10 text-primary",
                  !done && !active && "border-muted-foreground/30 text-muted-foreground",
                )}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "whitespace-nowrap text-xs",
                  active ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-0.5 flex-1 rounded-full transition-colors",
                  done ? "bg-green-600" : "bg-muted-foreground/20",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
