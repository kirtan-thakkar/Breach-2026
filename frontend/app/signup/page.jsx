"use client";

import { useRef, useState } from "react";
import { Link } from "next-view-transitions";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, FileUser, ShieldCheck, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import Container from "@/components/Container";
import { Button } from "@/components/ui/button";
import { getDashboardRouteForRole } from "@/lib/auth";
import { applyAuthSessionCookies, signupWithRole } from "@/lib/backend";
import { gsap, useGSAP } from "@/lib/gsap";

const ROLE_OPTIONS = [
  {
    id: "admin",
    title: "Admin",
    description: "Security team: Manage campaigns, analyze results, and generate AI insights.",
    icon: BriefcaseBusiness,
  },
  {
    id: "user",
    title: "End User",
    description: "Employee: View your own security posture, training history, and mock events.",
    icon: FileUser,
  },
];

export default function SignupPage() {
  const rootRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();
  const [role, setRole] = useState("admin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authHint, setAuthHint] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [mobile, setMobile] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setAuthHint("");

    try {
      const session = await signupWithRole({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        role,
        organization_name: organizationName.trim() || "Default",
        mobile: mobile.trim() || null,
      });

      applyAuthSessionCookies(session);

      const route = getDashboardRouteForRole(session?.role || role) || "/dashboard/user";
      router.replace(route);
    } catch (error) {
      setAuthHint(error instanceof Error ? error.message : "Signup failed. Please try again.");
      setIsSubmitting(false);
    }
  }

  useGSAP(
    () => {
      if (prefersReducedMotion) {
        return;
      }

      gsap.from(".signup-reveal", {
        y: 30,
        opacity: 0,
        filter: "blur(8px)",
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.08,
      });

      gsap.to(".signup-orb-one", {
        yPercent: 26,
        xPercent: -8,
        ease: "none",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.to(".signup-orb-two", {
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
    <section
      ref={rootRef}
      className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-breach-bg py-8 text-breach-text sm:py-12"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-breach-aura" />
        <div className="signup-orb-one absolute -left-24 top-14 size-72 rounded-full bg-breach-accent-3/18 blur-3xl" />
        <div className="signup-orb-two absolute -right-24 top-36 size-72 rounded-full bg-breach-accent-2/14 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-56 rounded-full bg-breach-accent/14 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(30,41,59,0.24)_1px,transparent_1px),linear-gradient(to_bottom,rgba(30,41,59,0.18)_1px,transparent_1px)] bg-size-[42px_42px] opacity-35" />
      </div>

      <Container>
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0.95, y: 8, filter: "blur(6px)" }}
          animate={prefersReducedMotion ? {} : { opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border border-breach-border/90 bg-breach-panel/80 shadow-(--shadow-breach-glow) backdrop-blur-xl lg:grid-cols-[0.95fr_1.35fr]"
        >
          <aside className="relative hidden min-h-full flex-col justify-between border-r border-breach-border/85 bg-breach-surface/70 p-8 lg:flex">
            <div className="space-y-4">
              <p className="signup-reveal inline-flex items-center gap-2 rounded-full border border-breach-accent/35 bg-breach-accent/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-emerald-200">
                <Sparkles className="size-3.5" />
                Breach 2026 Onboarding
              </p>
              <h1 className="signup-reveal max-w-sm text-3xl leading-tight font-semibold tracking-tighter text-breach-text">
                Build your secure account.
                <br />
                Start simulations with confidence.
              </h1>
              <p className="signup-reveal max-w-sm text-sm leading-relaxed text-breach-muted">
                Register your workspace to configure phishing campaigns, monitor behavior analytics, and train users in one controlled environment.
              </p>
              <ul className="signup-reveal space-y-2 text-sm text-breach-muted">
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-emerald-300" />
                  Role-based routing after sign-up
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-emerald-300" />
                  Access policies applied from day one
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-emerald-300" />
                  Built for internal awareness programs
                </li>
              </ul>
            </div>

            <div className="signup-reveal rounded-2xl border border-breach-border/85 bg-breach-panel/70 p-5">
              <div className="mb-3 inline-flex size-9 items-center justify-center rounded-xl border border-breach-accent/30 bg-breach-accent/12 text-emerald-200">
                <ShieldCheck className="size-4.5" />
              </div>
              <p className="text-sm font-medium text-breach-text">Identity and session controls are enforced on registration</p>
              <p className="mt-1 text-xs text-breach-muted">
                New accounts are provisioned with secure defaults and isolated dashboard views based on selected role.
              </p>
            </div>
          </aside>

          <div className="p-6 sm:p-8 md:p-10">
            <div className="mx-auto w-full max-w-2xl">
              <div className="mb-8 signup-reveal">
                <p className="text-sm font-medium uppercase tracking-[0.12em] text-breach-muted">Create account</p>
                <h2 className="mt-1 text-3xl font-semibold tracking-tighter text-breach-text">Set up your profile</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" aria-label="signup form">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="signup-reveal space-y-2">
                    <label htmlFor="fullName" className="text-sm font-medium text-breach-text">
                      Full name
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      placeholder="Taylor Morgan"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      required
                      className="h-11 w-full rounded-xl border border-breach-border bg-breach-surface px-3 text-sm text-breach-text outline-none transition placeholder:text-breach-muted/80 focus:border-breach-accent/45 focus:ring-3 focus:ring-breach-accent/20"
                    />
                  </div>

                  <div className="signup-reveal space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-breach-text">
                      Work email
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      className="h-11 w-full rounded-xl border border-breach-border bg-breach-surface px-3 text-sm text-breach-text outline-none transition placeholder:text-breach-muted/80 focus:border-breach-accent/45 focus:ring-3 focus:ring-breach-accent/20"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="signup-reveal space-y-2">
                    <label htmlFor="organizationName" className="text-sm font-medium text-breach-text">
                      Organization name
                    </label>
                    <input
                      id="organizationName"
                      type="text"
                      placeholder="Acme Corp"
                      value={organizationName}
                      onChange={(event) => setOrganizationName(event.target.value)}
                      className="h-11 w-full rounded-xl border border-breach-border bg-breach-surface px-3 text-sm text-breach-text outline-none transition placeholder:text-breach-muted/80 focus:border-breach-accent/45 focus:ring-3 focus:ring-breach-accent/20"
                    />
                  </div>

                  <div className="signup-reveal space-y-2">
                    <label htmlFor="mobile" className="text-sm font-medium text-breach-text">
                      Mobile number
                    </label>
                    <input
                      id="mobile"
                      type="tel"
                      placeholder="+91 9876543210"
                      value={mobile}
                      onChange={(event) => setMobile(event.target.value)}
                      className="h-11 w-full rounded-xl border border-breach-border bg-breach-surface px-3 text-sm text-breach-text outline-none transition placeholder:text-breach-muted/80 focus:border-breach-accent/45 focus:ring-3 focus:ring-breach-accent/20"
                    />
                  </div>
                </div>

                <div className="signup-reveal space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-breach-text">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="h-11 w-full rounded-xl border border-breach-border bg-breach-surface px-3 text-sm text-breach-text outline-none transition placeholder:text-breach-muted/80 focus:border-breach-accent/45 focus:ring-3 focus:ring-breach-accent/20"
                  />
                </div>

                <div className="signup-reveal space-y-3">
                  <p className="text-sm font-medium text-breach-text">Select your role</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {ROLE_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const active = role === option.id;

                      return (
                        <label
                          key={option.id}
                          className={`cursor-pointer rounded-2xl border p-4 transition ${
                            active
                              ? "border-breach-accent/45 bg-breach-accent/10"
                              : "border-breach-border/85 bg-breach-surface/65 hover:border-breach-accent/30"
                          }`}
                        >
                          <input
                            type="radio"
                            name="role"
                            value={option.id}
                            checked={active}
                            onChange={() => setRole(option.id)}
                            className="sr-only"
                          />

                          <div className="flex items-start gap-3">
                            <span
                              className={`inline-flex size-9 items-center justify-center rounded-xl border ${
                                active
                                  ? "border-breach-accent/35 bg-breach-accent/12 text-emerald-200"
                                  : "border-breach-border/80 bg-breach-panel/65 text-breach-muted"
                              }`}
                            >
                              <Icon className="size-4" />
                            </span>

                            <div>
                              <p className="text-sm font-semibold text-breach-text">{option.title}</p>
                              <p className="mt-1 text-xs leading-relaxed text-breach-muted">{option.description}</p>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <motion.div
                  className="signup-reveal"
                  whileHover={prefersReducedMotion ? {} : { y: -2 }}
                  whileTap={prefersReducedMotion ? {} : { scale: 0.99 }}
                  transition={{ type: "spring", stiffness: 220, damping: 18 }}
                >
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 w-full rounded-xl bg-breach-accent text-sm font-semibold text-slate-950 hover:bg-emerald-300"
                  >
                    {isSubmitting ? "Creating account..." : "Create account"}
                  </Button>
                </motion.div>

                {authHint ? <p className="text-xs text-amber-300">{authHint}</p> : null}
              </form>

              <p className="signup-reveal mt-6 text-center text-sm text-breach-muted">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-emerald-300 hover:text-emerald-200 hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}