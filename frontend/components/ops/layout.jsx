"use client";

import { Link } from "next-view-transitions";
import {
  BarChart3,
  CalendarClock,
  Clock3,
  Command,
  Home,
  Radar,
  Search,
  Target,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ADMIN_NAV = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard/advisor", icon: Home },
  { key: "campaign", label: "Campaigns", href: "/campaign", icon: Target },
  { key: "create-campaign", label: "Create Campaign", href: "/campaign/create", icon: CalendarClock, chip: "New" },
  { key: "analytics", label: "Analytics", href: "/analytics", icon: BarChart3 },
  { key: "simulation", label: "Simulation", href: "/simulation", icon: Radar },
];

const USER_NAV = [
  { key: "dashboard", label: "My Posture", href: "/dashboard/user", icon: Home },
  { key: "history", label: "Activity", href: "/dashboard/user#history", icon: Clock3 },
];

function NavItem({ href, label, icon: Icon, active, chip }) {
  return (
    <Link
      href={href}
      className={`group flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-colors ${
        active
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
          : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:text-slate-100"
      }`}
    >
      <span className="flex items-center gap-2.5">
        <Icon className="size-4" />
        {label}
      </span>
      {chip ? (
        <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-200">
          {chip}
        </span>
      ) : null}
    </Link>
  );
}

export default function OpsLayout({
  activeSection,
  title,
  subtitle,
  orgId,
  role = "admin", // Default for safety
  generatedAt,
  children,
  actions,
  searchPlaceholder = "Search campaign, target, event...",
}) {
  const navItems = role === "admin" ? ADMIN_NAV : USER_NAV;
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#03060d] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-0 top-28 h-105 w-105 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(30,41,59,0.28)_1px,transparent_1px),linear-gradient(to_bottom,rgba(30,41,59,0.2)_1px,transparent_1px)] bg-size-[42px_42px] opacity-35" />
      </div>

      <div className="relative z-10 mx-auto w-full px-2 pb-8 pt-4 sm:px-4 lg:px-4">
        <div className="grid gap-4 lg:grid-cols-[248px_minmax(0,1fr)]">
          <aside className="hidden min-h-[calc(100vh-2rem)] flex-col rounded-2xl border border-slate-800 bg-[#02040a]/90 p-4 lg:flex">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <span className="flex size-10 items-center justify-center rounded-xl border border-emerald-500/35 bg-emerald-500/10 text-emerald-200">
                <Command className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-100">Phishlytics</p>
                <p className="text-xs text-slate-500">Threat Simulation</p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {navItems.map(({ key, ...itemProps }) => (
                <NavItem key={key} {...itemProps} active={key === activeSection} />
              ))}
            </div>

            <div className="mt-auto rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-emerald-200/90">System Status</p>
              <p className="mt-1 text-sm font-medium text-emerald-100">All systems operational</p>
            </div>
          </aside>

          <main className="space-y-4">
            <header className="rounded-2xl border border-slate-800 bg-slate-950/75 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Operations Dashboard</p>
                  <h1 className="mt-1 text-2xl font-semibold text-slate-100 sm:text-[30px]">{title}</h1>
                  <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="muted">ORG {orgId}</Badge>
                  <Badge variant="default">Updated {generatedAt}</Badge>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                <label className="flex h-10 items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-3 text-sm text-slate-400">
                  <Search className="size-4" />
                  <span className="truncate">{searchPlaceholder}</span>
                </label>
                <Button
                  variant="outline"
                  className="h-10 border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-900"
                >
                  <Clock3 className="size-4" />
                  {generatedAt}
                </Button>
                {actions || (
                  <Button className="h-10 bg-emerald-500 text-slate-950 hover:bg-emerald-400">Live Mode</Button>
                )}
              </div>
            </header>

            {children}
          </main>
        </div>
      </div>
    </section>
  );
}
