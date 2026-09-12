import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ledger — compliance for small stores",
  description:
    "Track every licence, permit and deadline a Los Angeles corner store answers to, " +
    "and score an invoice against the USDA SNAP staple-stocking standard.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
