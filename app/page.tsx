import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/sections/Hero";
import { ProgramStrip } from "@/components/sections/ProgramStrip";
import { Industries } from "@/components/sections/Industries";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Undercount } from "@/components/sections/Undercount";
import { Coverage } from "@/components/sections/Coverage";
import { SocialProof } from "@/components/sections/SocialProof";
import { Pricing } from "@/components/sections/Pricing";
import { Faq } from "@/components/sections/Faq";
import { CtaBand } from "@/components/sections/CtaBand";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <ProgramStrip />
        <Industries />
        <HowItWorks />
        <Undercount />
        <Coverage ground="coal" />
        <SocialProof />
        <Pricing />
        <Faq />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
