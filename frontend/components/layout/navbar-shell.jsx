"use client";

import { usePathname } from "next/navigation";

import Navbar from "@/components/navbar";

export default function NavbarShell() {
  const pathname = usePathname();

  const isOpsRoute = ["/dashboard", "/analytics", "/campaign", "/simulation"].some((prefix) =>
    pathname?.startsWith(prefix)
  );

  if (isOpsRoute) {
    return null;
  }

  return (
    <section className="sticky top-4 z-50 backdrop-blur-md">
      <Navbar />
    </section>
  );
}
