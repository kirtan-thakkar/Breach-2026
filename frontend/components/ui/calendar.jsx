"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col gap-3",
        month: "space-y-3",
        month_caption: "flex items-center justify-between",
        caption_label: "text-sm font-medium text-slate-100",
        nav: "flex items-center gap-1",
        button_previous:
          "inline-flex size-7 items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-slate-300 transition hover:bg-slate-800 hover:text-slate-100",
        button_next:
          "inline-flex size-7 items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-slate-300 transition hover:bg-slate-800 hover:text-slate-100",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-9 text-center text-xs font-medium text-slate-500",
        week: "mt-1 flex w-full",
        day: "size-9 p-0 text-center text-sm",
        day_button:
          "inline-flex size-9 items-center justify-center rounded-md text-slate-200 transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:outline-none",
        selected: "bg-emerald-500 text-slate-950 hover:bg-emerald-400",
        today: "border border-emerald-400/50",
        outside: "text-slate-600",
        disabled: "cursor-not-allowed text-slate-600 opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: iconClassName, ...iconProps }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("size-4", iconClassName)} {...iconProps} />
          ) : (
            <ChevronRight className={cn("size-4", iconClassName)} {...iconProps} />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
