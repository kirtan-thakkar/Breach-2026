"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { motion } from "motion/react";

const faqs = [
  {
    question: "How quickly can we launch our first simulation?",
    answer:
      "Most teams launch the first campaign in under one hour after selecting templates, target groups, and notification preferences.",
  },
  {
    question: "Can we separate employee and administrator campaigns?",
    answer:
      "Yes. You can segment by role, department, region, and access level to keep scenarios relevant and governance-friendly.",
  },
  {
    question: "How are high-risk users identified?",
    answer:
      "Breach 2026 combines click behavior, credential submission attempts, and repeat-event patterns to flag priority cohorts.",
  },
  {
    question: "Do you support remediation tracking over time?",
    answer:
      "Yes. Trend dashboards compare behavior before and after training actions so teams can validate which interventions work.",
  },
  {
    question: "Can leaders access summary dashboards without full admin access?",
    answer:
      "Role-based views allow leadership reporting access while keeping campaign controls restricted to security operators.",
  },
  {
    question: "Is campaign data exportable for compliance evidence?",
    answer:
      "Exports include event logs, participation summaries, and remediation outcomes to support audit and policy reviews.",
  },
];

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <article className="border-b border-breach-border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-6 py-6 text-left text-2xl font-medium transition-colors hover:bg-slate-900/50 sm:px-8"
      >
        <span>{item.question}</span>
        {isOpen ? <Minus className="size-6 text-emerald-300" /> : <Plus className="size-6 text-emerald-300" />}
      </button>
      {isOpen ? (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="px-6 pb-6 text-lg leading-relaxed text-breach-muted sm:px-8"
        >
          {item.answer}
        </motion.p>
      ) : null}
    </article>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="border border-breach-border bg-breach-bg text-breach-text">
      <div className="grid border-b border-breach-border lg:grid-cols-[1.15fr_0.85fr]">
        <div className="p-7 sm:p-10">
          <h2 className="text-5xl font-medium tracking-tight">Your Questions, Answered</h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-breach-muted">
            Everything teams ask when implementing simulation-led awareness and response decision workflows.
          </p>
        </div>

        <div className="flex items-end border-t border-breach-border p-7 lg:justify-end lg:border-l lg:border-t-0 sm:p-10">
          <p className="text-2xl font-medium text-emerald-300">Need a custom rollout plan? ↗</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 lg:[&>*:nth-child(odd)]:border-r lg:[&>*:nth-child(odd)]:border-breach-border">
        {faqs.map((item, index) => (
          <FaqItem
            key={item.question}
            item={item}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex((value) => (value === index ? -1 : index))}
          />
        ))}
      </div>
    </section>
  );
}
