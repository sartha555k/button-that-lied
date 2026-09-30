import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Button That Lied",
  description:
    "A tiny checkout with three UX traps. A scripted session fails; rule-based evidence shows exactly why; the fixed flow reruns the same script. Synthetic demo data - no real users tracked.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
