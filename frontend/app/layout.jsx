import { DM_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/navbar";
import { ViewTransitions } from 'next-view-transitions'
export const metadata = {
  title: "Phishlytics",
  description: "Phishing simulation and cyber awareness platform",
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
      </body>
    </html>
    </ViewTransitions>
  );
}
