"use client";

import { usePathname } from "next/navigation";

import NavbarComponent from "@/components/navbar";

export default function Navbar() {
  const pathname = usePathname();

  const isOpsRoute = ["/dashboard", "/analytics", "/campaign", "/simulation"].some((prefix) =>
    pathname?.startsWith(prefix)
  );

  if (isOpsRoute) {
    return null;
  }

  return (
    <section className="sticky top-4 z-50 backdrop-blur-md">
      <NavbarComponent />
    </section>
  );
}
