import { Inter } from "next/font/google";
import "./globals.css";
import NavbarShell from "@/components/layout/navbar-shell";

export const metadata = {
  title: "Breach 2026",
  description: "A cyber attack application",
};

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} antialiased`}
      >
        <NavbarShell />
        {children}
      </body>
    </html>
  );
}
