"use client";

import { motion } from "motion/react";
import { IconCode, IconSparkles, IconShare } from "@tabler/icons-react";

const steps = [
  {
    step: "Step 01",
    title: "Create a simulation campaign",
    description:
      "Select target employees, campaign type, and delivery scope for your phishing awareness assessment.",
    icon: IconCode,
  },
  {
    step: "Step 02",
    title: "Launch dynamic phishing scenarios",
    description:
      "Generate contextual phishing emails and simulation links that feel realistic to each department.",
    icon: IconSparkles,
  },
  {
    step: "Step 03",
    title: "Analyze risk and benchmark",
    description:
      "Track clicks, credential attempts, and response timing, then compare performance against anonymous peer benchmarks.",
    icon: IconShare,
  },
];

const HowItWorks = () => {
  return (
    <section className="py-28">
      <div className="relative overflow-hidden rounded-[2rem] border border-neutral-200 bg-linear-to-br from-white via-neutral-50 to-cyan-50/60 p-6 shadow-aceternity md:p-10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-cyan-200/35 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-sky-300/15 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative z-10 max-w-2xl"
        >
          <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">
            How It Works
          </p>
          <h3 className="mt-3 text-4xl font-medium tracking-tighter text-primary md:text-5xl">
            Run cybersecurity simulations in three guided steps.
          </h3>
          <p className="mt-3 text-sm leading-6 text-neutral-600 md:text-base">
            A practical workflow for corporate administrators to test awareness,
            identify vulnerable behavior, and improve security posture.
          </p>
        </motion.div>

        <div className="relative z-10 mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {steps.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.article
                key={item.step}
                initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 0.35,
                  delay: index * 0.12,
                  ease: "easeInOut",
                }}
                className="group rounded-3xl border border-neutral-200 bg-white/85 p-6 backdrop-blur-sm transition-colors duration-300 hover:border-cyan-300"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
                    {item.step}
                  </span>
                  <div className="flex size-11 items-center justify-center rounded-2xl border border-neutral-200 text-neutral-600 transition-colors duration-300 group-hover:border-cyan-300 group-hover:text-cyan-700">
                    <Icon size={20} strokeWidth={1.9} />
                  </div>
                </div>

                <h4 className="mt-5 text-2xl font-medium tracking-tight text-primary">
                  {item.title}
                </h4>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  {item.description}
                </p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;