import type { Metadata } from "next";
import { Deck } from "./Deck";

export const metadata: Metadata = {
  title: "Ledger: the five-minute version",
  description:
    "Why permit compliance closes small stores, how the SNAP stocking rule actually works, and what Ledger does about it.",
};

export default function PitchPage() {
  return <Deck />;
}
