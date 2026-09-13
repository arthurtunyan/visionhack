import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Section } from "@/components/Section";
import { PageHeader } from "@/components/PageHeader";
import { AppWindow } from "@/components/AppWindow";
import { DashboardView } from "@/components/DashboardView";
import { CtaBand } from "@/components/sections/CtaBand";
import { NON_AFFILIATION } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "The dashboard",
  description:
    "Every licence a store holds on one screen: renewal dates, what is due this week and the latest SNAP stocking review.",
};

export default function DashboardPage() {
  return (
    <>
      <Nav />
      <main>
        <PageHeader
          eyebrow="The dashboard"
          title="Eight licences on one screen."
          intro="This is what a store owner sees after signing in: what is due, how long they have, and where the last invoice scan left them."
        />
        <Section ground="tint">
          <AppWindow url="app.ledger.co/overview">
            <DashboardView />
          </AppWindow>
          <p
            className="small mute"
            style={{ maxWidth: 720, margin: "34px auto 0", textAlign: "center" }}
          >
            Sample data for one store. {NON_AFFILIATION}
          </p>
        </Section>
        <CtaBand title="Put your licences on this screen." />
      </main>
      <Footer />
    </>
  );
}
