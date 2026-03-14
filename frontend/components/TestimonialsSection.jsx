"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";

const testimonials = [
  {
    id: "t1",
    quote:
      "Breach 2026 gave us clear, role-level evidence on where employees were repeatedly exposed. We cut risky click behavior by 31% in two quarters.",
    name: "A. Morgan",
    title: "Security Operations Lead",
    company: "NorthBridge Manufacturing",
  },
  {
    id: "t2",
    quote:
      "The alert priority model helped us stop treating every incident the same way. We now act faster on the scenarios that matter most.",
    name: "S. Patel",
    title: "Information Security Manager",
    company: "Crestline Health Systems",
  },
  {
    id: "t3",
    quote:
      "Simulation-to-training recommendations turned raw metrics into decisions our leadership could approve in one review meeting.",
    name: "J. Rivera",
    title: "Director of Security Awareness",
    company: "Altura Financial Services",
  },
];

export default function TestimonialsSection() {
  const [index, setIndex] = useState(0);
  const current = testimonials[index];

  function handlePrev() {
    setIndex((value) => (value === 0 ? testimonials.length - 1 : value - 1));
  }

  function handleNext() {
    setIndex((value) => (value === testimonials.length - 1 ? 0 : value + 1));
  }

  return (
    <section className="border border-breach-border bg-breach-bg text-breach-text">
      <div className="grid border-b border-breach-border lg:grid-cols-[1.1fr_1fr]">
        <div className="p-7 sm:p-10">
          <h2 className="text-5xl font-medium tracking-tight">Trusted By Security Teams Worldwide</h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-breach-muted">
            Teams use Breach 2026 to turn simulation behavior into focused actions that reduce real-world compromise risk.
          </p>
        </div>

        <div className="border-t border-breach-border p-7 lg:border-l lg:border-t-0 sm:p-10">
          <p className="text-lg leading-relaxed text-breach-muted">
            Decision support is built into every campaign cycle so teams can prioritize interventions, prove improvement, and report confidently.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.6fr]">
        <motion.article
          key={current.id}
          initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.28 }}
          className="border-b border-breach-border p-7 lg:border-b-0 lg:border-r sm:p-12"
        >
          <p className="max-w-4xl text-4xl leading-tight font-medium tracking-tight sm:text-5xl">“{current.quote}”</p>

          <div className="mt-10">
            <p className="text-3xl font-medium">{current.name}</p>
            <p className="mt-2 text-lg text-breach-muted">{current.title}</p>
            <p className="text-lg text-breach-muted">{current.company}</p>
          </div>

          <p className="mt-10 text-2xl text-slate-400">{index + 1}/{testimonials.length}</p>
        </motion.article>

        <div className="grid border-t border-breach-border lg:border-t-0">
          <button
            type="button"
            onClick={handlePrev}
            className="flex items-center justify-between border-b border-breach-border px-7 py-8 text-3xl font-medium transition-colors hover:bg-slate-900/60"
          >
            <span className="inline-flex items-center gap-3">
              <ChevronLeft className="size-7" />
              Previous
            </span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="flex items-center justify-between px-7 py-8 text-3xl font-medium transition-colors hover:bg-slate-900/60"
          >
            <span className="inline-flex items-center gap-3">
              Next
              <ChevronRight className="size-7" />
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
