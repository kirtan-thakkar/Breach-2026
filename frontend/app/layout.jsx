import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/navbar";

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
        <Navbar />
        {children}
      </body>
    </html>
  );
}
