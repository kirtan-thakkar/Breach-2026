"use client";

import { motion } from "motion/react";
import { Link } from "next-view-transitions";
import { ArrowUpRight } from "lucide-react";

const steps = [
  {
    step: "1",
    title: "Create your simulation",
    description:
      "Pick target groups, campaign style, and timing windows by team risk profile.",
    meta: ["Audience: Finance + Operations", "Template: Invoice lure", "Delivery: Staggered rollout"],
  },
  {
    step: "2",
    title: "Launch and monitor in real time",
    description:
      "Track opens, clicks, credential attempts, and report rates as data arrives.",
    meta: ["Open rate trend", "Click and submit events", "Manager escalation signals"],
  },
  {
    step: "3",
    title: "Decide remediation actions",
    description:
      "Prioritize retraining, targeted follow-ups, and policy updates from the behavior data.",
    meta: ["At-risk cohort shortlist", "Recommended training path", "30-day retest plan"],
  },
];

const HowItWorks = () => {
  return (
    <section className="border border-breach-border bg-breach-bg text-breach-text">
      <div className="grid border-b border-breach-border lg:grid-cols-[1.2fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="p-7 sm:p-10"
        >
          <h2 className="text-4xl font-medium tracking-tight sm:text-5xl">How It Works</h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-breach-muted">
            A practical operating flow for security teams to make the right decisions at the right time.
          </p>
        </motion.div>

        <div className="flex items-end justify-start border-t border-breach-border p-7 lg:justify-end lg:border-l lg:border-t-0 sm:p-10">
          <Link
            href="/campaign/create"
            className="inline-flex items-center gap-2 text-2xl font-medium text-emerald-300 transition-colors hover:text-emerald-200"
          >
            Create campaign now
            <ArrowUpRight className="size-5" />
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3">
        {steps.map((item, index) => (
          <motion.article
            key={item.step}
            initial={{ opacity: 0, y: 16, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.34, delay: index * 0.1, ease: "easeOut" }}
            className="relative border-t border-breach-border p-6 md:border-r md:border-t-0 md:last:border-r-0 sm:p-8"
          >
            <span className="mb-6 inline-flex size-11 items-center justify-center rounded-full border border-slate-700 bg-slate-950/75 text-2xl font-medium text-slate-200">
              {item.step}
            </span>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/75 p-4">
              <p className="text-sm text-breach-muted">{item.meta[0]}</p>
              <p className="mt-3 text-sm text-breach-muted">{item.meta[1]}</p>
              <p className="mt-3 text-sm text-breach-muted">{item.meta[2]}</p>
            </div>

            <h3 className="mt-7 text-4xl font-medium tracking-tight">{item.title}</h3>
            <p className="mt-4 text-lg leading-relaxed text-breach-muted">{item.description}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;