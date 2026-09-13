import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { Pricing } from "@/components/sections/Pricing";
import { Faq } from "@/components/sections/Faq";
import { CtaBand } from "@/components/sections/CtaBand";

export const metadata: Metadata = {
  title: "Pricing: first store free",
  description:
    "Straightforward pricing for single stores, groups and chains. The first store is always free.",
};

export default function PricingPage() {
  return (
    <>
      <Nav />
      <main>
        <PageHeader
          eyebrow="Pricing"
          title="First store free. The rest is simple."
          intro="No per-scan fees, no integration cost. Prices are placeholder while we finish onboarding."
        />
        <Pricing heading="Pick a plan." />
        <Faq />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
