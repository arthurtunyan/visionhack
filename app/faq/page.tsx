import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { Faq } from "@/components/sections/Faq";
import { CtaBand } from "@/components/sections/CtaBand";

export const metadata: Metadata = {
  title: "FAQ: the questions we get asked",
  description:
    "Straight answers on affiliation, blurry photos, case counts, POS integration and who Ledger is for.",
};

export default function FaqPage() {
  return (
    <>
      <Nav />
      <main>
        <PageHeader
          eyebrow="FAQ"
          title="Straight answers."
          intro="If yours isn't here, the demo will probably answer it faster than we can."
        />
        <Faq heading="Everything, in order." />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
