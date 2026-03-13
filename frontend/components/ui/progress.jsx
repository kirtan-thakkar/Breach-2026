"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

function Progress({ className, value = 0, indicatorClassName }) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        data-slot="progress-indicator"
        className={cn("h-full bg-primary transition-all duration-700 ease-out", indicatorClassName)}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

export { Progress };
