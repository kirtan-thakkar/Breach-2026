"use client";

import { useMemo, useState } from "react";
import { Check, ToggleLeft, ToggleRight } from "lucide-react";
import { motion } from "motion/react";

const plans = [
  {
    key: "starter",
    name: "Starter",
    monthly: 0,
    yearly: 0,
    subtitle: "For small security teams validating baseline awareness.",
    features: [
      "Up to 3 active campaigns",
      "Click and report event tracking",
      "Basic department risk view",
      "CSV export for compliance",
    ],
  },
  {
    key: "defense",
    name: "Team Defense",
    monthly: 29,
    yearly: 24,
    subtitle: "For teams running continuous phishing simulation programs.",
    featured: true,
    features: [
      "Unlimited campaigns and templates",
      "Credential-attempt risk scoring",
      "Priority alert and escalation rules",
      "Manager-level remediation reports",
      "30/60/90 day trend dashboards",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise SOC",
    monthly: 89,
    yearly: 74,
    subtitle: "For large organizations with multi-region governance.",
    features: [
      "Multi-tenant org management",
      "Custom role and access controls",
      "Advanced benchmark analytics",
      "SSO and audit-grade logging",
      "Dedicated security success lead",
    ],
  },
];

function PlanCard({ plan, billingMode }) {
  const amount = billingMode === "yearly" ? plan.yearly : plan.monthly;
  const displayAmount = amount === 0 ? "Free" : `$${amount}`;

  return (
    <article
      className={`border-breach-border p-6 sm:p-8 ${
        plan.featured ? "bg-emerald-500/7" : "bg-transparent"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-3xl font-medium tracking-tight text-breach-text">{plan.name}</p>
          <p className="mt-2 text-breach-muted">{plan.subtitle}</p>
        </div>
        {plan.featured ? (
          <span className="rounded-full border border-emerald-300/35 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-200">
            Most used
          </span>
        ) : null}
      </div>

      <div className="mt-6 flex items-end gap-2">
        <p className="text-6xl font-medium tracking-tight text-breach-text">{displayAmount}</p>
        <p className="pb-2 text-xl text-breach-muted">/month</p>
      </div>

      <button
        type="button"
        className={`mt-6 h-11 rounded-full border px-6 text-lg font-medium transition-colors ${
          plan.featured
            ? "border-emerald-300/45 bg-breach-accent text-slate-950 hover:bg-emerald-300"
            : "border-slate-700 bg-slate-950/70 text-slate-200 hover:border-slate-600"
        }`}
      >
        Get started
      </button>

      <div className="mt-7 border-t border-breach-border pt-5">
        <p className="mb-4 text-sm uppercase tracking-[0.14em] text-slate-500">Includes</p>
        <ul className="space-y-3">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-lg text-slate-200">
              <Check className="mt-1 size-4 text-emerald-300" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export default function PlansSection() {
  const [billingMode, setBillingMode] = useState("monthly");

  const details = useMemo(
    () =>
      billingMode === "yearly"
        ? "Yearly billing includes a built-in savings rate for long-term simulation programs."
        : "Monthly billing keeps rollout flexible while you validate team adoption.",
    [billingMode]
  );

  return (
    <section className="border border-breach-border bg-breach-bg text-breach-text">
      <div className="grid border-b border-breach-border lg:grid-cols-[1.1fr_1fr]">
        <div className="p-7 sm:p-10">
          <h2 className="text-5xl font-medium tracking-tight">Choose Your Plan. Improve Awareness Faster.</h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-breach-muted">
            Transparent pricing for simulation coverage, behavior analytics, and remediation guidance.
          </p>
        </div>

        <div className="flex items-center border-t border-breach-border p-7 lg:justify-end lg:border-l lg:border-t-0 sm:p-10">
          <button
            type="button"
            onClick={() => setBillingMode((mode) => (mode === "monthly" ? "yearly" : "monthly"))}
            className="inline-flex items-center gap-3 rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-lg font-medium"
          >
            <span className={billingMode === "monthly" ? "text-slate-100" : "text-slate-500"}>Monthly</span>
            {billingMode === "monthly" ? (
              <ToggleLeft className="size-8 text-slate-500" />
            ) : (
              <ToggleRight className="size-8 text-emerald-300" />
            )}
            <span className={billingMode === "yearly" ? "text-slate-100" : "text-slate-500"}>Yearly</span>
          </button>
        </div>
      </div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.32 }}
        className="border-b border-breach-border p-5 text-center text-base text-breach-muted"
      >
        {details}
      </motion.p>

      <div className="grid md:grid-cols-3">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.key}
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.32, delay: index * 0.08, ease: "easeOut" }}
            className="border-t border-breach-border md:border-r md:border-t-0 md:last:border-r-0"
          >
            <PlanCard plan={plan} billingMode={billingMode} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
