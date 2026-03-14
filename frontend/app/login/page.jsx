"use client";

import { useRef, useState } from "react";
import Link from "next/link";
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
    <section ref={rootRef} className="relative overflow-hidden py-8 sm:py-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="orb-one absolute -left-24 top-18 size-72 rounded-full bg-cyan-500/18 blur-3xl" />
        <div className="orb-two absolute -right-24 top-40 size-72 rounded-full bg-amber-500/16 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-56 rounded-full bg-emerald-500/14 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(14,165,233,0.1),transparent_33%),radial-gradient(circle_at_85%_18%,rgba(245,158,11,0.09),transparent_34%),radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.1),transparent_34%)]" />
      </div>

      <Container>
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0.95, y: 8 , filter: "blur(6px)"}}
          animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 , filter: "blur(0px)"}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border/70 bg-card/85 shadow-aceternity backdrop-blur-xl md:grid-cols-2"
        >
          <aside className="relative hidden min-h-136 flex-col justify-between border-r border-border/60 p-8 md:flex">
            <div className="space-y-4">
              <p className="login-reveal inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="size-3.5" />
                Application-Name
              </p>
              <h1 className="login-reveal max-w-sm text-3xl leading-tight font-semibold tracking-tighter text-foreground">
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
                <h2 className="mt-1 text-3xl font-semibold tracking-tighter text-foreground">Access your account</h2>
              </div>

              <form className="space-y-4" aria-label="login form" onSubmit={handleSubmit}>
                <div className="login-reveal space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30"
                    autoComplete="email"
                    required
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
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30"
                    autoComplete="current-password"
                    required
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
                  transition={{ type: "spring", stiffness: 220, damping: 18 }}
                >
                  <Button type="submit" disabled={isSubmitting} className="h-11 w-full rounded-xl text-sm font-semibold">
                    {isSubmitting ? "Signing in..." : "Continue"}
                  </Button>
                </motion.div>
              </form>

              {authHint ? <p className="mt-3 text-xs text-amber-300">{authHint}</p> : null}

              <p className="login-reveal mt-6 text-center text-sm text-muted-foreground">
                New here?{" "}
                <Link href="/signup" className="font-medium text-primary hover:underline">
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
