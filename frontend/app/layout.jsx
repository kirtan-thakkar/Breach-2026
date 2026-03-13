import { DM_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";

export const metadata = {
  title: "Breach 2026",
  description: "A cyber attack application",
};

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.className} antialiased`}
      >
        <section className="sticky z-100 top-4 backdrop-blur-md ">
          <Navbar />
        </section>
        {children}
      </body>
    </html>
  );
}
