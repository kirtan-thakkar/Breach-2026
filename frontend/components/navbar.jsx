"use client";

import { Link } from "next-view-transitions";
import { useRouter } from "next/navigation";
import {
  LayoutGroup,
  motion,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import Container from "./Container";
import { clearAuthSessionCookies } from "@/lib/backend";
import { getDashboardRouteForRole, normalizeRole } from "@/lib/auth";

const Navbar = () => {
  const router = useRouter();
  const navItems = [
    { title: "Analytics", href: "/analytics" },
    { title: "Simulation", href: "/simulation" },
  ];

  const [hoveredItem, setHoveredItem] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authState, setAuthState] = useState({ isAuthenticated: false, role: null });
  const profileRef = useRef(null);
  const { scrollY } = useScroll();

  const dashboardHref = useMemo(() => {
    return getDashboardRouteForRole(authState.role) || "/dashboard";
  }, [authState.role]);

  function readClientCookie(name) {
    if (typeof document === "undefined") return "";
    const prefix = `${encodeURIComponent(name)}=`;
    const parts = document.cookie.split(";").map((part) => part.trim());
    const match = parts.find((part) => part.startsWith(prefix));
    if (!match) return "";
    return decodeURIComponent(match.slice(prefix.length));
  }

  function syncAuthState() {
    const token = readClientCookie("auth_session");
    const roleCookie = normalizeRole(readClientCookie("role"));
    setAuthState({
      isAuthenticated: Boolean(token),
      role: roleCookie,
    });
  }

  function handleLogout() {
    clearAuthSessionCookies();
    setProfileOpen(false);
    setMobileOpen(false);
    syncAuthState();
    router.push("/login");
  }

  useEffect(() => {
    syncAuthState();
    const handleVisibility = () => {
      if (!document.hidden) {
        syncAuthState();
      }
    };
    const handleWindowFocus = () => syncAuthState();
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, []);

  useEffect(() => {
    function onDocClick(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 10);
  });

  return (
    <nav>
      <motion.div
        initial={{
          opacity: 0.992,
          filter: "blur(4px)",
          y: -2,
        }}
        animate={{
          opacity: 1,
          filter: "blur(0px)",
          y: scrolled ? 6 : 0,
        }}
        transition={{
          duration: 0.45,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        <Container>
          <motion.div
            animate={{
              width: scrolled ? "92%" : "100%",
              borderRadius: scrolled ? "1.5rem" : "1rem",
              boxShadow: scrolled
                ? "0 14px 32px -24px rgba(16,185,129,0.42)"
                : "0 10px 24px -24px rgba(16,185,129,0.3)",
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative mx-auto overflow-visible border border-slate-800/80 bg-clip-padding px-4 py-4 backdrop-blur-xl sm:px-6 sm:py-5"
          >
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(130%_95%_at_50%_48%,rgba(2,6,23,0.16)_0%,rgba(2,6,23,0.10)_26%,rgba(2,6,23,0.38)_58%,rgba(2,6,23,0.78)_100%)]" />
            <div className="pointer-events-none absolute -left-10 top-0 -z-10 h-28 w-48 rounded-full bg-emerald-400/14 blur-3xl" />
            <div className="pointer-events-none absolute -right-8 top-2 -z-10 h-26 w-44 rounded-full bg-cyan-400/10 blur-3xl" />

            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="cursor-pointer text-primary">
                <h2 className="text-lg font-medium tracking-tighter text-white sm:text-xl">Phishlytics</h2>
              </Link>

              <LayoutGroup>
                <div className="relative hidden items-center justify-center gap-1 sm:flex sm:gap-2">
                  {navItems.map((item) => (
                    <Link
                      className="relative rounded-md px-2 py-1.5 text-sm text-slate-100 transition-colors hover:text-emerald-200 sm:px-3"
                      key={item.href}
                      href={item.href}
                      onMouseEnter={() => {
                        setHoveredItem(item.href);
                      }}
                      onMouseLeave={() => {
                        setHoveredItem(null);
                      }}
                      onFocus={() => {
                        setHoveredItem(item.href);
                      }}
                      onBlur={() => {
                        setHoveredItem(null);
                      }}
                    >
                      {hoveredItem === item.href && (
                        <motion.span
                          layoutId="navbar-hover-pill"
                          className="absolute inset-0 h-full w-full rounded-md bg-slate-900/85"
                          transition={{ duration: 0.2, ease: "easeOut" }}
                        />
                      )}
                      <span className="relative z-10">{item.title}</span>
                    </Link>
                  ))}

                  {!authState.isAuthenticated ? (
                    <Link
                      href="/login"
                      className="relative rounded-md px-3 py-1.5 text-sm text-slate-100 transition-colors hover:text-emerald-200"
                    >
                      Login
                    </Link>
                  ) : (
                    <div className="relative" ref={profileRef}>
                      <button
                        type="button"
                        onClick={() => setProfileOpen((prev) => !prev)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-sm text-slate-100 hover:border-emerald-400/40"
                      >
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-semibold text-emerald-200">
                          {authState.role === "admin" ? "A" : "U"}
                        </span>
                        Profile
                      </button>

                      {profileOpen ? (
                        <div className="absolute right-0 top-full z-50 mt-2 min-w-40 rounded-lg border border-slate-700 bg-slate-950/95 p-1.5 shadow-xl">
                          <Link
                            href={dashboardHref}
                            className="block rounded-md px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                            onClick={() => setProfileOpen(false)}
                          >
                            Dashboard
                          </Link>
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="block w-full rounded-md px-3 py-2 text-left text-sm text-rose-300 hover:bg-slate-800"
                          >
                            Logout
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </LayoutGroup>

              <button
                type="button"
                className="inline-flex h-9 items-center rounded-md border border-slate-700 px-3 text-sm text-slate-200 sm:hidden"
                onClick={() => setMobileOpen((prev) => !prev)}
              >
                Menu
              </button>
            </div>

            {mobileOpen ? (
              <div className="mt-3 grid gap-2 border-t border-slate-800/80 pt-3 sm:hidden">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-md px-2 py-2 text-sm text-slate-100 hover:bg-slate-900/70"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.title}
                  </Link>
                ))}

                {!authState.isAuthenticated ? (
                  <Link
                    href="/login"
                    className="rounded-md px-2 py-2 text-sm text-slate-100 hover:bg-slate-900/70"
                    onClick={() => setMobileOpen(false)}
                  >
                    Login
                  </Link>
                ) : (
                  <>
                    <Link
                      href={dashboardHref}
                      className="rounded-md px-2 py-2 text-sm text-slate-100 hover:bg-slate-900/70"
                      onClick={() => setMobileOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="rounded-md px-2 py-2 text-left text-sm text-rose-300 hover:bg-slate-900/70"
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            ) : null}

            {scrolled && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-emerald-300/8"
              />
            )}
          </motion.div>
        </Container>
      </motion.div>
    </nav>
  );
};

export default Navbar;
