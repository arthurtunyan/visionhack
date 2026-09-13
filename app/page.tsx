import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/sections/Hero";
import { ProgramStrip } from "@/components/sections/ProgramStrip";
import { WhatWeDo } from "@/components/sections/WhatWeDo";
import { Industries } from "@/components/sections/Industries";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Coverage } from "@/components/sections/Coverage";
import { Pricing } from "@/components/sections/Pricing";
import { CtaBand } from "@/components/sections/CtaBand";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <WhatWeDo />
        <ProgramStrip />
        <Industries />
        <HowItWorks />
        <Coverage ground="coal" />
        <Pricing />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
