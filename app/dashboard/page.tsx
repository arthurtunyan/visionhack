import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Section } from "@/components/Section";
import { PageHeader } from "@/components/PageHeader";
import { StoreDashboard } from "@/components/dashboard/StoreDashboard";
import { NON_AFFILIATION } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Dashboard — every deadline and the shelves",
  description:
    "One readiness figure across every licence, permit and deadline a store answers to, " +
    "with the wholesale order-record scan feeding the SNAP stocking standard directly into it.",
};

export default function DashboardPage() {
  return (
    <>
      <Nav />
      <main>
        <PageHeader
          eyebrow="Dashboard"
          title="Every deadline, and the shelves, in one number."
          intro="Paperwork and stocking are the two ways a store loses SNAP. Scan a wholesale order record and the result moves the same score your permits do."
        />
        <Section ground="tint">
          <StoreDashboard />
          <p
            className="small mute"
            style={{ maxWidth: 720, margin: "36px auto 0", textAlign: "center" }}
          >
            {NON_AFFILIATION}
          </p>
        </Section>
      </main>
      <Footer />
    </>
  );
}
