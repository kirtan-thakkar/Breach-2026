"use client";
import { Link } from "next-view-transitions";
import Container from "./Container";
import { Safari } from "./ui/safari";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
const HeroPage = () => {
  return (
    <section className="relative isolate flex min-h-screen items-center overflow-hidden bg-breach-bg px-1 py-12 text-breach-text sm:px-2 sm:py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-breach-aura" />
        <div className="absolute -left-22 top-14 h-70 w-70 rounded-full bg-breach-accent/12 blur-3xl" />
        <div className="absolute right-0 top-22 h-90 w-90 rounded-full bg-breach-accent-2/12 blur-3xl" />
      </div>

      <Container className="relative z-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-7 text-center">
            <motion.p
              initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.38, ease: "easeOut" }}
              className="inline-flex items-center gap-2 rounded-full border border-breach-accent/30 bg-breach-accent/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-emerald-200"
            >
              Security Operations Platform
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 16, filter: "blur(10px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.42, delay: 0.06, ease: "easeOut" }}
              className="max-w-4xl text-5xl leading-[1.03] font-semibold tracking-[-0.03em] text-breach-text sm:text-6xl md:text-7xl"
            >
              Take Control Of
              <br />
              Human Risk Exposure
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.35, delay: 0.14 }}
              className="w-full max-w-3xl text-base leading-relaxed text-breach-muted sm:text-lg"
            >
              Breach 2026 helps corporate security teams run phishing and social engineering simulations for employees and administrators. Track clicks, credential submission attempts, and response behavior in one centralized dashboard.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{ duration: 0.34, delay: 0.22 }}
              className="flex w-full justify-center"
            >
              <Button
                asChild
                className="h-12 rounded-full bg-breach-accent px-8 text-base font-semibold text-slate-950 hover:bg-emerald-300"
              >
                <Link href="/campaign/create">Launch a Campaign</Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.42, delay: 0.3, ease: "easeOut" }}
              className="w-full max-w-5xl pt-6 sm:pt-8"
            >
              <Safari
                url="breach2026.app/dashboard"
                imageSrc="/image.png"
              />
            </motion.div>
        </div>
      </Container>
    </section>
  );
};
export default HeroPage;
