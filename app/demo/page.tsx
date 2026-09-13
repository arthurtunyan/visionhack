import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Section } from "@/components/Section";
import { PageHeader } from "@/components/PageHeader";
import { DemoScanner } from "@/components/demo/DemoScanner";
import { CtaBand } from "@/components/sections/CtaBand";
import { NON_AFFILIATION } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Live demo: scan a wholesale order record",
  description:
    "Photograph a wholesale order record and see the stocking scorecard Ledger builds, in English or Spanish, with every uncertain line held back.",
};

export default function DemoPage() {
  return (
    <>
      <Nav />
      <main>
        <PageHeader
          eyebrow="Live demo"
          title="Scan an order record. Read the scorecard."
          intro="Upload a photo of a printed wholesale order record, or load one of our samples. Ledger counts only what it can read and holds back anything it can't."
        />
        <Section ground="tint">
          <DemoScanner />
          <p
            className="small mute"
            style={{ maxWidth: 720, margin: "36px auto 0", textAlign: "center" }}
          >
            {NON_AFFILIATION}
          </p>
        </Section>
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
