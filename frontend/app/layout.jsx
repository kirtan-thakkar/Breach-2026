import { DM_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/navbar";
import { ViewTransitions } from 'next-view-transitions'
import { View } from "lucide-react";
export const metadata = {
  title: "Breach 2026",
  description: "A cyber attack application",
};

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({ children }) {
  return (

    <ViewTransitions>
    <html lang="en">
      <body
        className={`${dmSans.className} min-h-screen bg-[#020617] text-slate-100 antialiased`}
      >
        <Navbar />
        {children}
        <SecurityAssistant />
      </body>
    </html>
    </ViewTransitions>
  );
}
