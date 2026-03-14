import * as React from "react"
import { cva } from "class-variance-authority";
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium capitalize tracking-[0.02em] whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "text-black bg-[linear-gradient(135deg,#34d399_0%,#6ee7b7_44%,#22d3ee_100%)] shadow-[0_0_0_1px_rgba(16,185,129,0.42),0_0_26px_rgba(34,211,238,0.44),inset_0_1px_0_rgba(255,255,255,0.45)] hover:brightness-110",
        outline:
          "border-emerald-300/60 text-black bg-[linear-gradient(135deg,rgba(110,231,183,0.93),rgba(74,222,128,0.9),rgba(45,212,191,0.88))] shadow-[0_0_0_1px_rgba(110,231,183,0.35),0_0_20px_rgba(45,212,191,0.28)] hover:brightness-110 aria-expanded:brightness-110",
        secondary:
          "text-black bg-[linear-gradient(135deg,#bef264_0%,#86efac_50%,#5eead4_100%)] shadow-[0_0_0_1px_rgba(163,230,53,0.36),0_0_20px_rgba(94,234,212,0.32)] hover:brightness-105 aria-expanded:brightness-105",
        ghost:
          "text-black bg-[linear-gradient(135deg,rgba(192,132,252,0.9),rgba(45,212,191,0.86))] shadow-[0_0_0_1px_rgba(167,139,250,0.35),0_0_18px_rgba(45,212,191,0.3)] hover:brightness-110 aria-expanded:brightness-110",
        destructive:
          "text-black bg-[linear-gradient(135deg,#fb7185_0%,#fb923c_48%,#facc15_100%)] shadow-[0_0_0_1px_rgba(251,113,133,0.38),0_0_18px_rgba(251,146,60,0.28)] hover:brightness-105 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        link: "text-black bg-[linear-gradient(135deg,#34d399_0%,#22d3ee_100%)] underline underline-offset-4 hover:brightness-110",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />
  );
}

export { Button, buttonVariants }
