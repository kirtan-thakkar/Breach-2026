"use client";

import { useRef } from "react";
import Link from "next/link";
import { Shield, Sparkles, Lock, Activity, Gauge } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Container from "@/components/Container";
import { Button } from "@/components/ui/button";
import { gsap, useGSAP } from "@/lib/gsap";

const LoginPage = () => {
  const rootRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  useGSAP(
    () => {
      if (prefersReducedMotion) {
        return;
      }

      gsap.from(".login-reveal", {
        y: 36,
        opacity: 0,
        filter: "blur(8px)",
        duration: 1,
        ease: "power4.out",
        stagger: 0.08,
      });

      gsap.to(".orb-one", {
        yPercent: 30,
        xPercent: -8,
        ease: "none",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.to(".orb-two", {
        yPercent: -25,
        xPercent: 12,
        ease: "none",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.utils.toArray(".trust-card").forEach((card, index) => {
        gsap.from(card, {
          y: 46,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          delay: index * 0.06,
          scrollTrigger: {
            trigger: card,
            start: "top 88%",
            once: true,
          },
        });
      });
    },
    { scope: rootRef, dependencies: [prefersReducedMotion] }
  );

  return (
    <section ref={rootRef} className="relative overflow-hidden py-8 sm:py-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="orb-one absolute -left-24 top-18 size-72 rounded-full bg-cyan-500/18 blur-3xl" />
        <div className="orb-two absolute -right-24 top-40 size-72 rounded-full bg-amber-500/16 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-56 rounded-full bg-emerald-500/14 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(14,165,233,0.1),transparent_33%),radial-gradient(circle_at_85%_18%,rgba(245,158,11,0.09),transparent_34%),radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.1),transparent_34%)]" />
      </div>

      <Container>
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0.95, y: 8 }}
          animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border/70 bg-card/85 shadow-aceternity backdrop-blur-xl md:grid-cols-2"
        >
          <aside className="relative hidden min-h-136 flex-col justify-between border-r border-border/60 p-8 md:flex">
            <div className="space-y-4">
              <p className="login-reveal inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="size-3.5" />
                Breach 2026 Control Desk
              </p>
              <h1 className="login-reveal max-w-sm text-3xl leading-tight font-semibold tracking-tight text-foreground">
                Welcome back.
                <br />
                Secure access starts here.
              </h1>
              <p className="login-reveal max-w-sm text-sm leading-relaxed text-muted-foreground">
                Log in to continue monitoring campaigns, simulation timelines, and analytics from one secure workspace.
              </p>
            </div>

            <div className="login-reveal rounded-2xl border border-border/70 bg-background/70 p-5">
              <div className="mb-3 inline-flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Shield className="size-4.5" />
              </div>
              <p className="text-sm font-medium text-foreground">Protected by role-based access controls</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Session checks, activity logging, and challenge rules are enforced at sign-in.
              </p>
            </div>
          </aside>

          <div className="p-6 sm:p-8 md:p-10">
            <div className="mx-auto w-full max-w-sm">
              <div className="mb-8 login-reveal">
                <p className="text-sm font-medium text-muted-foreground">Sign in</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Access your account</h2>
              </div>

              <form className="space-y-4" aria-label="login form">
                <div className="login-reveal space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30"
                    autoComplete="email"
                  />
                </div>

                <div className="login-reveal space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium text-foreground">
                      Password
                    </label>
                    <Link href="#" className="text-xs font-medium text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30"
                    autoComplete="current-password"
                  />
                </div>

                <div className="login-reveal flex items-center justify-between text-sm">
                  <label className="inline-flex items-center gap-2 text-muted-foreground">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-border text-primary focus:ring-2 focus:ring-ring/30"
                    />
                    Remember me
                  </label>
                  <p className="text-xs text-muted-foreground">2FA available after login</p>
                </div>

                <motion.div
                  className="login-reveal"
                  whileHover={prefersReducedMotion ? {} : { y: -2 }}
                  whileTap={prefersReducedMotion ? {} : { scale: 0.99 }}
                  transition={{ type: "spring", stiffness: 240, damping: 20 }}
                >
                  <Button type="submit" className="h-11 w-full rounded-xl text-sm font-semibold">
                    Continue
                  </Button>
                </motion.div>
              </form>

              <p className="login-reveal mt-6 text-center text-sm text-muted-foreground">
                New here?{" "}
                <Link href="#" className="font-medium text-primary hover:underline">
                  Request access
                </Link>
              </p>
            </div>
          </div>
        </motion.div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article className="trust-card rounded-2xl border border-border/70 bg-card/80 p-5 shadow-aceternity backdrop-blur-lg">
            <div className="mb-3 inline-flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Lock className="size-4" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Encrypted Session Envelope</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Every sign-in event is wrapped with contextual metadata and anomaly checks.
            </p>
          </article>

          <article className="trust-card rounded-2xl border border-border/70 bg-card/80 p-5 shadow-aceternity backdrop-blur-lg">
            <div className="mb-3 inline-flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Activity className="size-4" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Live Threat Telemetry</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Login activity instantly syncs with campaign simulation dashboards and event streams.
            </p>
          </article>

          <article className="trust-card rounded-2xl border border-border/70 bg-card/80 p-5 shadow-aceternity backdrop-blur-lg sm:col-span-2 lg:col-span-1">
            <div className="mb-3 inline-flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Gauge className="size-4" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Adaptive Challenge Scoring</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Access policies adapt to risk score, location fingerprinting, and device history.
            </p>
          </article>
        </div>
      </Container>
    </section>
  );
};

export default LoginPage;
