"use client";

import { useState } from "react";
import { Link } from "next-view-transitions";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, FileUser, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import Container from "@/components/Container";
import { Button } from "@/components/ui/button";
import { getDashboardRouteForRole } from "@/lib/auth";
import { applyAuthSessionCookies, signupWithRole } from "@/lib/backend";

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

  return (
    <section className="relative overflow-hidden py-10 sm:py-14">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-28 top-10 size-80 rounded-full bg-emerald-500/14 blur-3xl" />
        <div className="absolute right-0 top-28 size-80 rounded-full bg-cyan-500/18 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(16,185,129,0.12),transparent_34%),radial-gradient(circle_at_85%_20%,rgba(6,182,212,0.1),transparent_36%),radial-gradient(circle_at_50%_92%,rgba(14,165,233,0.08),transparent_34%)]" />
      </div>

      <Container>
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14, filter: "blur(8px)" }}
          animate={prefersReducedMotion ? {} : { opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-3xl rounded-3xl border border-border/70 bg-card/85 p-6 shadow-aceternity backdrop-blur-xl sm:p-8"
        >
          <div className="mb-8 space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5" />
              Secure onboarding
            </p>
            <h1 className="text-3xl font-semibold tracking-tighter text-foreground sm:text-4xl">Create your account</h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Choose the role you need. Your role is used for post-auth routing and dashboard access policy.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" aria-label="signup form">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium text-foreground">
                  Full name
                </label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="Taylor Morgan"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Work email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="organizationName" className="text-sm font-medium text-foreground">
                  Organization name
                </label>
                <input
                  id="organizationName"
                  type="text"
                  placeholder="Acme Corp"
                  value={organizationName}
                  onChange={(event) => setOrganizationName(event.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="mobile" className="text-sm font-medium text-foreground">
                  Mobile number
                </label>
                <input
                  id="mobile"
                  type="tel"
                  placeholder="+91 9876543210"
                  value={mobile}
                  onChange={(event) => setMobile(event.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30"
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Select your role</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {ROLE_OPTIONS.map((option, index) => {
                  const Icon = option.icon;
                  const active = role === option.id;

                  return (
                    <motion.label
                      key={option.id}
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 + index * 0.05, duration: 0.32 }}
                      className={`cursor-pointer rounded-2xl border p-4 transition ${
                        active
                          ? "border-emerald-400/50 bg-emerald-500/10"
                          : "border-border/70 bg-background/60 hover:border-emerald-500/30"
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
                              ? "border-emerald-300/40 bg-emerald-500/15 text-emerald-200"
                              : "border-border/70 bg-background/70 text-muted-foreground"
                          }`}
                        >
                          <Icon className="size-4" />
                        </span>

                        <div>
                          <p className="text-sm font-semibold text-foreground">{option.title}</p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{option.description}</p>
                        </div>
                      </div>
                    </motion.label>
                  );
                })}
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="h-11 w-full rounded-xl text-sm font-semibold">
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>

            {authHint ? <p className="text-xs text-amber-300">{authHint}</p> : null}
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </Container>
    </section>
  );
}