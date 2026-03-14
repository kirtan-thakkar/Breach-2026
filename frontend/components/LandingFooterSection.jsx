"use client";

import { Link } from "next-view-transitions";

const navLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Campaigns", href: "/campaign" },
  { label: "Analytics", href: "/analytics" },
  { label: "Simulation", href: "/simulation" },
];

const resourceLinks = [
  { label: "Security Playbooks", href: "#" },
  { label: "Awareness Templates", href: "#" },
  { label: "Admin Guide", href: "#" },
  { label: "FAQ", href: "#" },
];

export default function LandingFooterSection() {
  return (
    <section className="border border-breach-border bg-breach-bg text-breach-text">
      <div className="border-b border-breach-border px-6 py-14 text-center sm:px-10">
        <h2 className="text-5xl font-medium tracking-tight sm:text-6xl">Ready to reduce simulation risk?</h2>
        <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-breach-muted">
          Launch your next phishing and social engineering campaign with decision-ready analytics, guided remediation insights, and role-based visibility.
        </p>
        <Link
          href="/campaign/create"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-breach-accent px-7 py-3 text-xl font-medium text-slate-950 transition-colors hover:bg-emerald-300"
        >
          Start campaign now
          <span aria-hidden="true">↗</span>
        </Link>
      </div>

      <footer className="grid gap-10 px-6 py-12 sm:px-10 md:grid-cols-[1.2fr_0.6fr_0.6fr]">
        <div>
          <h3 className="text-4xl font-medium tracking-tight">Breach 2026</h3>
          <p className="mt-4 max-w-md text-xl leading-relaxed text-breach-muted">
            Continuous simulation and behavior analytics for corporate security teams.
          </p>
        </div>

        <div>
          <p className="text-sm uppercase tracking-[0.16em] text-slate-500">Navigation</p>
          <ul className="mt-4 space-y-2">
            {navLinks.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="text-xl text-slate-200 transition-colors hover:text-emerald-300">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm uppercase tracking-[0.16em] text-slate-500">Resources</p>
          <ul className="mt-4 space-y-2">
            {resourceLinks.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="text-xl text-slate-200 transition-colors hover:text-emerald-300">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </section>
  );
}
