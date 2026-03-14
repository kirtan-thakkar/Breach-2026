"use client";

import { Link } from "next-view-transitions";
import {
  LayoutGroup,
  motion,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import { useState } from "react";
import Container from "./Container";

const Navbar = () => {
  const navItems = [
    { title: "Login", href: "/login" },
    { title: "Dashboard", href: "/dashboard" },
    { title: "Analytics", href: "/analytics" },
    { title: "Simulation", href: "/simulation" },
  ];

  const [hoveredItem, setHoveredItem] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

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
            className="relative mx-auto overflow-hidden border border-slate-800/80 bg-clip-padding px-4 py-4 backdrop-blur-xl sm:px-6 sm:py-5"
          >
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(130%_95%_at_50%_48%,rgba(2,6,23,0.16)_0%,rgba(2,6,23,0.10)_26%,rgba(2,6,23,0.38)_58%,rgba(2,6,23,0.78)_100%)]" />
            <div className="pointer-events-none absolute -left-10 top-0 -z-10 h-28 w-48 rounded-full bg-emerald-400/14 blur-3xl" />
            <div className="pointer-events-none absolute -right-8 top-2 -z-10 h-26 w-44 rounded-full bg-cyan-400/10 blur-3xl" />

            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="cursor-pointer text-primary">
                <h2 className="text-lg font-medium tracking-tighter text-white sm:text-xl">Phishlytics</h2>
              </Link>

              <LayoutGroup>
                <div className="relative flex items-center justify-center gap-1 sm:gap-2">
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
                </div>
              </LayoutGroup>
            </div>

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
