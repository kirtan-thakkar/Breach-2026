"use client";

import { useRef, useState } from "react";
import { Link } from "next-view-transitions";
import { useRouter } from "next/navigation";
import { Shield, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Container from "@/components/Container";
import { Button } from "@/components/ui/button";
import { getDashboardRouteForRole } from "@/lib/auth";
import { applyAuthSessionCookies, loginWithPassword } from "@/lib/backend";
import { gsap, useGSAP } from "@/lib/gsap";

const LoginPage = () => {
  const rootRef = useRef(null);
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authHint, setAuthHint] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setAuthHint("");

    try {
      const session = await loginWithPassword({
        email: email.trim(),
        password,
      });

      applyAuthSessionCookies(session);

      const route = getDashboardRouteForRole(session?.role);
      router.replace(route || "/dashboard/user");
    } catch (error) {
      setAuthHint(error instanceof Error ? error.message : "Login failed. Please try again.");
      setIsSubmitting(false);
    }
  }

  useGSAP(
    () => {
      if (prefersReducedMotion) {
        return;
      }

      gsap.from(".login-reveal", {
        y: 30,
        opacity: 0,
        filter: "blur(8px)",
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.08,
      });

      gsap.to(".orb-one", {
        yPercent: 28,
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
        yPercent: -22,
        xPercent: 10,
        ease: "none",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });

    },
    { scope: rootRef, dependencies: [prefersReducedMotion] }
  );

  return (
    <section ref={rootRef} className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-breach-bg py-8 text-breach-text sm:py-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-breach-aura" />
        <div className="orb-one absolute -left-24 top-18 size-72 rounded-full bg-breach-accent-3/18 blur-3xl" />
        <div className="orb-two absolute -right-24 top-40 size-72 rounded-full bg-breach-accent-2/14 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-56 rounded-full bg-breach-accent/14 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(30,41,59,0.24)_1px,transparent_1px),linear-gradient(to_bottom,rgba(30,41,59,0.18)_1px,transparent_1px)] bg-size-[42px_42px] opacity-35" />
      </div>

      <Container>
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0.95, y: 8 , filter: "blur(6px)"}}
          animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 , filter: "blur(0px)"}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-breach-border/90 bg-breach-panel/80 shadow-(--shadow-breach-glow) backdrop-blur-xl md:grid-cols-2"
        >
          <aside className="relative hidden min-h-136 flex-col justify-between border-r border-breach-border/85 bg-breach-surface/70 p-8 md:flex">
            <div className="space-y-4">
              <p className="login-reveal inline-flex items-center gap-2 rounded-full border border-breach-accent/35 bg-breach-accent/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-emerald-200">
                <Sparkles className="size-3.5" />
                Breach 2026 Access
              </p>
              <h1 className="login-reveal max-w-sm text-3xl leading-tight font-semibold tracking-tighter text-breach-text">
                Welcome back.
                <br />
                Secure access starts here.
              </h1>
              <p className="login-reveal max-w-sm text-sm leading-relaxed text-breach-muted">
                Log in to continue monitoring campaigns, simulation timelines, and analytics from one secure workspace.
              </p>
            </div>

            <div className="login-reveal rounded-2xl border border-breach-border/85 bg-breach-panel/70 p-5">
              <div className="mb-3 inline-flex size-9 items-center justify-center rounded-xl border border-breach-accent/30 bg-breach-accent/12 text-emerald-200">
                <Shield className="size-4.5" />
              </div>
              <p className="text-sm font-medium text-breach-text">Protected by role-based access controls</p>
              <p className="mt-1 text-xs text-breach-muted">
                Session checks, activity logging, and challenge rules are enforced at sign-in.
              </p>
            </div>
          </aside>

          <div className="p-6 sm:p-8 md:p-10">
            <div className="mx-auto w-full max-w-sm">
              <div className="mb-8 login-reveal">
                <p className="text-sm font-medium uppercase tracking-[0.12em] text-breach-muted">Sign in</p>
                <h2 className="mt-1 text-3xl font-semibold tracking-tighter text-breach-text">Access your account</h2>
              </div>

              <form className="space-y-4" aria-label="login form" onSubmit={handleSubmit}>
                <div className="login-reveal space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-breach-text">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-11 w-full rounded-xl border border-breach-border bg-breach-surface px-3 text-sm text-breach-text outline-none transition placeholder:text-breach-muted/80 focus:border-breach-accent/45 focus:ring-3 focus:ring-breach-accent/20"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="login-reveal space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium text-breach-text">
                      Password
                    </label>
                    <Link href="#" className="text-xs font-medium text-emerald-300 hover:text-emerald-200 hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-11 w-full rounded-xl border border-breach-border bg-breach-surface px-3 text-sm text-breach-text outline-none transition placeholder:text-breach-muted/80 focus:border-breach-accent/45 focus:ring-3 focus:ring-breach-accent/20"
                    autoComplete="current-password"
                    required
                  />
                </div>

                <div className="login-reveal flex items-center justify-between text-sm">
                  <label className="inline-flex items-center gap-2 text-breach-muted">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-breach-border bg-breach-surface text-emerald-300 focus:ring-2 focus:ring-emerald-300/30"
                    />
                    Remember me
                  </label>
                  <p className="text-xs text-breach-muted">2FA available after login</p>
                </div>

                <motion.div
                  className="login-reveal"
                  whileHover={prefersReducedMotion ? {} : { y: -2 }}
                  whileTap={prefersReducedMotion ? {} : { scale: 0.99 }}
                  transition={{ type: "spring", stiffness: 220, damping: 18 }}
                >
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 w-full rounded-xl bg-breach-accent text-sm font-semibold text-slate-950 hover:bg-emerald-300"
                  >
                    {isSubmitting ? "Signing in..." : "Continue"}
                  </Button>
                </motion.div>
              </form>

              {authHint ? <p className="mt-3 text-xs text-amber-300">{authHint}</p> : null}

              <p className="login-reveal mt-6 text-center text-sm text-breach-muted">
                New here?{" "}
                <Link href="/signup" className="font-medium text-emerald-300 hover:text-emerald-200 hover:underline">
                  Create account
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
};

export default LoginPage;
