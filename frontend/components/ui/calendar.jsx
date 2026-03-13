"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

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
        months: "flex flex-col gap-4 sm:flex-row sm:gap-6",
        month: "space-y-4",
        caption: "relative flex items-center justify-center pt-1",
        caption_label: "text-sm font-medium text-slate-200",
        nav: "flex items-center gap-1",
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "absolute left-1 h-7 w-7 bg-transparent p-0 text-slate-300 opacity-80 hover:opacity-100"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "absolute right-1 h-7 w-7 bg-transparent p-0 text-slate-300 opacity-80 hover:opacity-100"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-9 rounded-md text-[0.8rem] font-normal text-slate-500",
        week: "mt-2 flex w-full",
        day: "h-9 w-9 p-0 text-sm font-normal text-slate-200 rounded-md hover:bg-slate-800 transition-colors outline-none focus-visible:ring-0",
        day_button: "h-9 w-9",
        selected: "bg-emerald-500 text-slate-950 hover:bg-emerald-400 focus:bg-emerald-400 focus-visible:ring-0",
        today: "border border-emerald-400/40",
        outside: "text-slate-600",
        disabled: "text-slate-600 opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation, ...chevronProps }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("size-4", className)} {...chevronProps} />
          ) : (
            <ChevronRight className={cn("size-4", className)} {...chevronProps} />
          ),
      }}
      {...props}
    />
  )
}

export { Calendar }
