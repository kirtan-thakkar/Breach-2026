"use client";

import { Link } from "next-view-transitions";
import { motion } from "motion/react";
import {
  Activity,
  Eye,
  ShieldCheck,
  Siren,
} from "lucide-react";

const decisionGrid = [
  {
    icon: Eye,
    title: "Risk Visibility",
    description:
      "See who clicked, submitted credentials, or reported suspicious messages with timestamped event trails.",
  },
  {
    icon: Siren,
    title: "Priority Alerts",
    description:
      "Highlight high-impact departments first so security teams can make the right intervention decisions fast.",
  },
  {
    icon: Activity,
    title: "Behavior Trends",
    description:
      "Track campaign-over-campaign behavior shifts to identify where awareness training is working or failing.",
  },
  {
    icon: ShieldCheck,
    title: "Actionable Guidance",
    description:
      "Convert simulation outcomes into concrete remediation steps for admins, people managers, and end users.",
  },
];

const ChoosePage = () => {
  return (
    <section className="border border-breach-border bg-breach-bg text-breach-text">
      <div className="grid border-b border-breach-border md:grid-cols-[1.2fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 12, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="p-7 sm:p-10"
        >
          <h2 className="text-4xl font-medium tracking-tight sm:text-5xl">Why Security Teams Choose Breach 2026</h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-breach-muted">
            Designed to guide rapid, high-confidence decisions during phishing simulation reviews and awareness response planning.
          </p>
        </motion.div>

        <div className="flex items-end justify-start border-t border-breach-border p-7 md:justify-end md:border-l md:border-t-0 sm:p-10">
          <Link
            href="/analytics"
            className="inline-flex items-center gap-2 text-xl font-medium text-emerald-300 transition-colors hover:text-emerald-200"
          >
            Explore analytics
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4">
        {decisionGrid.map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.33, delay: index * 0.08, ease: "easeOut" }}
              className="group border-t border-breach-border p-6 transition-colors hover:bg-slate-900/50 sm:p-8 md:border-t-0 md:border-r nth-[2n]:md:border-r-0 xl:nth-[2n]:border-r xl:nth-[4n]:border-r-0"
            >
              <div className="mb-10 inline-flex size-12 items-center justify-center rounded-full border border-slate-700 bg-slate-950/80 text-breach-muted transition-colors group-hover:border-emerald-400/30 group-hover:text-emerald-200">
                <Icon className="size-5" />
              </div>

              <h3 className="text-3xl font-medium tracking-tight text-breach-text">{item.title}</h3>
              <p className="mt-4 text-lg leading-relaxed text-breach-muted">{item.description}</p>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
};

export default ChoosePage;
